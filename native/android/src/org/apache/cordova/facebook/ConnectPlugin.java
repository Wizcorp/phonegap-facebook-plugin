package org.apache.cordova.facebook;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.Iterator;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.util.Log;

import com.facebook.android.DialogError;
import com.facebook.android.Facebook;
import com.facebook.android.Facebook.DialogListener;
import com.facebook.android.FacebookError;
import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;

public class ConnectPlugin extends Plugin {

    public static final String SINGLE_SIGN_ON_DISABLED = "service_disabled";
    private final String TAG = "ConnectPlugin";

    private Facebook facebook;
    private String userId;
    //used for dialog auth
    private String[] permissions = new String[] {};
    private String callbackId;
    private Bundle paramBundle;
    private String method;

    private void logStatus(PluginResult.Status status, String message){
      Log.d(TAG, PluginResult.StatusMessages[status.ordinal()] + ": " + message);
    }

    public PluginResult logResult(PluginResult.Status status, final JSONObject json){
      logStatus(status, json.toString());
      return new PluginResult(status, json);
    }
    public PluginResult logResult(PluginResult.Status status, final String msg, final JSONObject json){
      logStatus(status, msg + ": " +  json.toString());
      return new PluginResult(status, json);
    }
    public PluginResult logResult(PluginResult.Status status, final String msg){
      logStatus(status, msg.toString());
      return new PluginResult(status, msg);
    }
    public PluginResult logNoResult(final String msg){
      logStatus(PluginResult.Status.NO_RESULT, msg);
      return new PluginResult(PluginResult.Status.NO_RESULT);
    }

    @Override
    public PluginResult execute(String action, JSONArray args, final String callbackId) {
        PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
        pr.setKeepCallback(true);

        if (action.equals("init")) {
            try {
                String appId = args.getString(0);

                facebook = new Facebook(appId);

                Log.d(TAG, "init: Initializing plugin.");

                SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this.ctx.getContext());
                String access_token = prefs.getString("access_token", null);
                Long expires = prefs.getLong("access_expires", -1);

                if (access_token != null && expires != -1) {
                    this.facebook.setAccessToken(access_token);
                    this.facebook.setAccessExpires(expires);
                	  try {
                        JSONObject o = new JSONObject(this.facebook.request("/me"));
                        this.userId = o.getString("id");
                    } catch (MalformedURLException e) {
                        e.printStackTrace();
                    } catch (IOException e) {
                        e.printStackTrace();
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                }

                if(!facebook.isSessionValid()) {
                    return logNoResult("session invalid");
                } else if (this.userId == null) {
                    return logNoResult("no userId");
                } else {
                    return logResult(PluginResult.Status.OK, "init", this.getResponse());
                }
            } catch (JSONException e) {
                e.printStackTrace();
                return logResult(PluginResult.Status.ERROR, "Invalid JSON args used. expected a string as the first arg.");
            }
        }

        else if (action.equals("login")) {
            if (facebook != null) {
            	final ConnectPlugin me = this;
                String[] permissions = new String[args.length()];
                try {
                    for (int i=0; i<args.length(); i++) {
                        permissions[i] = args.getString(i);
                    }
                } catch (JSONException e1) {
                    // TODO Auto-generated catch block
                    e1.printStackTrace();
                    return logResult(PluginResult.Status.ERROR, "Invalid JSON args used. Expected a string array of permissions.");
                }

                this.ctx.setActivityResultCallback(this);
                this.permissions = permissions;
                this.callbackId = callbackId;

                Log.d(TAG, "authorizing");

                Runnable runnable = new Runnable() {
                    public void run() {
                        me.facebook.authorize((Activity)me.ctx, me.permissions, new AuthorizeListener(me));
                    };
                };
                this.ctx.runOnUiThread(runnable);
            } else {
                pr = logResult(PluginResult.Status.ERROR, "Must call init before login.");
            }
        }

        else if (action.equals("logout")) {
            if (facebook != null) {
                try {
                    facebook.logout(this.ctx.getContext());

                    SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this.ctx.getContext());
                    prefs.edit().putLong("access_expires", -1).commit();
                    prefs.edit().putString("access_token", null).commit();
                } catch (MalformedURLException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                    pr = logResult(PluginResult.Status.MALFORMED_URL_EXCEPTION, "Error logging out.");
                } catch (IOException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                    pr = logResult(PluginResult.Status.IO_EXCEPTION, "Error logging out.");
                }
                pr = logResult(PluginResult.Status.OK, "logout", getResponse());
            } else {
                pr = logResult(PluginResult.Status.ERROR, "Must call init before logout.");
            }
        }

        else if (action.equals("getLoginStatus")) {
            if (facebook != null) {
                pr = logResult(PluginResult.Status.OK, "getLoginStatus", getResponse());
            } else {
                pr = logResult(PluginResult.Status.ERROR, "Must call init before getLoginStatus.");
            }
        }
        
        else if (action.equals("showDialog")) {
        	if (facebook != null) {
        		Bundle collect = new Bundle();
        		JSONObject params = null;
        		try {
        			params = args.getJSONObject(0);
        		} catch (JSONException e) {
        			params = new JSONObject();
        		}
        		
        		final ConnectPlugin me = this;
        		Iterator<?> iter = params.keys();
        		while (iter.hasNext()) {
        			String key = (String) iter.next();
        			if (key.equals("method")) {
        				try {
        					this.method = params.getString(key);
        				} catch (JSONException e) {
        					Log.w(TAG, "Nonstring method parameter provided to dialog");
        				}
        			} else {
        				try {
        					collect.putString(key, params.getString(key));
        				} catch (JSONException e) {
        					// Need to handle JSON parameters
        					Log.w(TAG, "Nonstring parameter provided to dialog discarded");
        				}
        			}
        		}
        		this.paramBundle =  new Bundle(collect);
        		this.callbackId = callbackId;
        		Runnable runnable = new Runnable() {
        			public void run() {
        				me.facebook.dialog (me.ctx.getContext(), me.method , me.paramBundle , new UIDialogListener(me));
        			};
        		};
        		this.ctx.runOnUiThread(runnable);
        	} else {
        		pr = logResult(PluginResult.Status.ERROR, "Must call init before showDialog.");
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
            "\"authResponse\": {"+
              "\"accessToken\": \""+facebook.getAccessToken()+"\","+
              "\"expiresIn\": \""+facebook.getAccessExpires()+"\","+
              "\"session_key\": true,"+
              "\"sig\": \"...\","+
              "\"userId\": \""+this.userId+"\""+
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
    
    class UIDialogListener implements DialogListener {
   	 final ConnectPlugin fba;

		public UIDialogListener(ConnectPlugin fba){
			super();
			this.fba = fba;
		}

		public void onComplete(Bundle values) {
            this.fba.success(logResult(PluginResult.Status.OK, values.toString()), this.fba.callbackId);
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
            SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this.fba.ctx.getContext());
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

