package com.phonegap.facebook;

import java.io.IOException;
import java.net.MalformedURLException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.util.Log;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.*;

import com.facebook.android.DialogError;
import com.facebook.android.Facebook;
import com.facebook.android.Facebook.DialogListener;
import com.facebook.android.FacebookError;
import com.phonegap.api.Plugin;
import com.phonegap.api.PluginResult;

public class ConnectPlugin extends Plugin {

    public static final String SINGLE_SIGN_ON_DISABLED = "service_disabled";
    private final String TAG = "ConnectPlugin";

    private Facebook facebook;
    private String userId;
    //used for dialog auth
    private String[] permissions = new String[] {};
    private String callbackId;

    @Override
    public PluginResult execute(String action, JSONArray args, final String callbackId) {
        PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
        pr.setKeepCallback(true);

        if (action.equals("init")) {
            try {
                String appId = args.getString(0);

                facebook = new Facebook(appId);

                Log.d(TAG, "init: Initializing plugin.");

                SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this.ctx);
                String access_token = prefs.getString("access_token", null);
                Long expires = prefs.getLong("access_expires", -1);

                if (access_token != null && expires != -1) {
                    this.facebook.setAccessToken(access_token);
                    this.facebook.setAccessExpires(expires);
                	  try {
                        JSONObject o = new JSONObject(this.facebook.request("/me"));
                        this.userId = o.getString("id");
                    } catch (MalformedURLException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                    } catch (IOException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                    } catch (JSONException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                    }
                }

                if(facebook.isSessionValid() && this.userId != null) {
                    return new PluginResult(PluginResult.Status.OK, this.getResponse());					
                }
                else {
                    return new PluginResult(PluginResult.Status.NO_RESULT);
                }
            } catch (JSONException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
                return new PluginResult(PluginResult.Status.ERROR, "Invalid JSON args used. expected a string as the first arg.");
            }
        }
        
        else if (action.equals("login")) {
            if (facebook != null) {
                if (facebook.isSessionValid()) {
                    Log.d(TAG, "login: Session already valid.");
                    pr = new PluginResult(PluginResult.Status.OK, getResponse());
                } else {
                    final ConnectPlugin me = this;
                    String[] permissions = new String[args.length()];
                    try {
                        for (int i=0; i<args.length(); i++) {
                            permissions[i] = args.getString(i);
                        }
                    } catch (JSONException e1) {
                        // TODO Auto-generated catch block
                        e1.printStackTrace();
                        return new PluginResult(PluginResult.Status.ERROR, "Invalid JSON args used. Expected a string array of permissions.");
                    }

                    this.ctx.setActivityResultCallback(this);
                    this.permissions = permissions;
                    this.callbackId = callbackId;
                    Runnable runnable = new Runnable() {
                        public void run() {
                            me.facebook.authorize((Activity)me.ctx, me.permissions, new AuthorizeListener(me));
                        };
                    };
                    this.ctx.runOnUiThread(runnable);
                }
            } else {
                pr = new PluginResult(PluginResult.Status.ERROR, "Must call init before login.");
            }
        }
        
        else if (action.equals("logout")) {
            if (facebook != null) {
                try {
                    facebook.logout(this.ctx);
                    
                    SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this.ctx);
                    prefs.edit().putLong("access_expires", -1).commit();
                    prefs.edit().putString("access_token", null).commit();
                } catch (MalformedURLException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                    pr = new PluginResult(PluginResult.Status.MALFORMED_URL_EXCEPTION, "Error logging out.");
                } catch (IOException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                    pr = new PluginResult(PluginResult.Status.IO_EXCEPTION, "Error logging out.");
                }
                pr = new PluginResult(PluginResult.Status.OK, getResponse());
            } else {
                pr = new PluginResult(PluginResult.Status.ERROR, "Must call init before logout.");
            }
        }

        else if (action.equals("getLoginStatus")) {
            if (facebook != null) {
                pr = new PluginResult(PluginResult.Status.OK, getResponse());
            } else {
                pr = new PluginResult(PluginResult.Status.ERROR, "Must call init before getLoginStatus.");
            }
        }

        return pr;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        facebook.authorizeCallback(requestCode, resultCode, data);
    }

    public JSONObject getResponse() {
        String response = "{"+
            "\"status\": \""+(facebook.isSessionValid() ? "connected" : "unknown")+"\","+
            "\"session\": {"+
              "\"access_token\": \""+facebook.getAccessToken()+"\","+
              "\"expires\": \""+facebook.getAccessExpires()+"\","+
              "\"session_key\": true,"+
              "\"sig\": \"...\","+
              "\"uid\": \""+this.userId+"\""+
            "}"+
          "}";

        try {
            return new JSONObject(response);
        } catch (JSONException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return new JSONObject();
    }

    class AuthorizeListener implements DialogListener {
        final ConnectPlugin fba;

        public AuthorizeListener(ConnectPlugin fba){
            super();
            this.fba = fba;
        }

        public void onComplete(Bundle values) {
            //  Handle a successful login

            String token = this.fba.facebook.getAccessToken();
            long token_expires = this.fba.facebook.getAccessExpires();
            SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this.fba.ctx);
            prefs.edit().putLong("access_expires", token_expires).commit();
            prefs.edit().putString("access_token", token).commit();

          	Log.d(TAG, "authorized");
            Log.d(TAG, values.toString());

            try {
                JSONObject o = new JSONObject(this.fba.facebook.request("/me"));
                this.fba.userId = o.getString("id");
                this.fba.success(getResponse(), this.fba.callbackId);
            } catch (MalformedURLException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            } catch (IOException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            } catch (JSONException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        }

        public void onFacebookError(FacebookError e) {
            Log.d(TAG, "facebook error");
            this.fba.error("Facebook error: " + e.getMessage(), callbackId);
        }

        public void onError(DialogError e) {
            Log.d(TAG, "other error");
            this.fba.error("Dialog error: " + e.getMessage(), this.fba.callbackId);
        }

        public void onCancel() {
            Log.d(TAG, "cancel");
            this.fba.error("Cancelled", this.fba.callbackId);
        }
    }
}

