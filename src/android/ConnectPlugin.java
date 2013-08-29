package org.apache.cordova.facebook;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.Iterator;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.util.Log;

import com.facebook.android.DialogError;
import com.facebook.android.Facebook;
import com.facebook.android.Facebook.DialogListener;
import com.facebook.android.FacebookError;

public class ConnectPlugin extends CordovaPlugin {

    public static final String SINGLE_SIGN_ON_DISABLED = "service_disabled";
    private final String TAG = "ConnectPlugin";

    private Facebook facebook;
    private String userId;
    //used for dialog auth
    private String[] permissions = new String[] {};
    private CallbackContext callbackContext;
    private Bundle paramBundle;
    private String method;

    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) {

        if (action.equals("init")) {
            try {
                String appId = args.getString(0);

                facebook = new Facebook(appId);

                Log.d(TAG, "init: Initializing plugin.");

                SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(cordova.getActivity());
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

                if(facebook.isSessionValid() && this.userId != null) {
                	callbackContext.success(this.getResponse());
                    return true;
                }
                else {
                	callbackContext.success();
                    return true;
                }
            } catch (JSONException e) {
               
                e.printStackTrace();
                callbackContext.error("Invalid JSON args used. expected a string as the first arg.");
                return false;
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
                   
                    e1.printStackTrace();
                    callbackContext.error("Invalid JSON args used. Expected a string array of permissions.");
                    return false;
                }
                cordova.setActivityResultCallback(this);
//                this.ctx.setActivityResultCallback(this);
                this.permissions = permissions;
                this.callbackContext = callbackContext;
                Runnable runnable = new Runnable() {
                    public void run() {
                        me.facebook.authorize(cordova.getActivity(), me.permissions, new AuthorizeListener(me));
                    };
                };
                cordova.getActivity().runOnUiThread(runnable);
//                this.ctx.runOnUiThread(runnable);
            } else {
            	callbackContext.error("Must call init before login.");
            	return false;
            }
        }

        else if (action.equals("logout")) {
            if (facebook != null) {
                try {
                    facebook.logout(cordova.getActivity());

                    SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this.cordova.getActivity());
                    prefs.edit().putLong("access_expires", -1).commit();
                    prefs.edit().putString("access_token", null).commit();
                } catch (MalformedURLException e) {
                   
                    e.printStackTrace();
                    callbackContext.error("Error logging out : Malformed exception");
                    return false;
                } catch (IOException e) {
                   
                    e.printStackTrace();
                    callbackContext.error("Error logging out : IOException");
                    return false;
                }
                callbackContext.success(getResponse());
                return true;
            } else {
            	callbackContext.error("Must call init before logout.");
            	return false;
            }
        }

        else if (action.equals("getLoginStatus")) {
            if (facebook != null) {
            	callbackContext.success(getResponse());
            	return true;
            } else {
            	callbackContext.error("Must call init before getLoginStatus.");
            	return false;
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
        		this.callbackContext = callbackContext;
        		Runnable runnable = new Runnable() {
        			public void run() {
        				me.facebook.dialog (me.cordova.getActivity(), me.method , me.paramBundle , new UIDialogListener(me));
        			};
        		};
        		cordova.getActivity().runOnUiThread(runnable);
//        		this.ctx.runOnUiThread(runnable);
        	} else {
        		callbackContext.error("Must call init before showDialog.");
        		return false;
        	}
        	
        }
        
        return true;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        facebook.authorizeCallback(requestCode, resultCode, data);
    }

    public JSONObject getResponse() {
    	String response;
    	if (facebook.isSessionValid()) {
    		long expiresTimeInterval = facebook.getAccessExpires() - System.currentTimeMillis();
    		long expiresIn = (expiresTimeInterval > 0) ? expiresTimeInterval : 0;
    		response = "{"+
            "\"status\": \"connected\","+
            "\"authResponse\": {"+
              "\"accessToken\": \""+facebook.getAccessToken()+"\","+
              "\"expiresIn\": \""+expiresIn+"\","+
              "\"session_key\": true,"+
              "\"sig\": \"...\","+
              "\"userId\": \""+this.userId+"\""+
            "}"+
          "}";
    	} else {
    		response = "{"+
            "\"status\": \"unknown\""+
          "}";
    	}

        try {
            return new JSONObject(response);
        } catch (JSONException e) {
           
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
			//  Handle a successful dialog
			Log.d(TAG,values.toString());
			this.fba.callbackContext.success();
		}

		public void onFacebookError(FacebookError e) {
           Log.d(TAG, "facebook error");
           this.fba.callbackContext.error("Facebook error: " + e.getMessage());
       }

       public void onError(DialogError e) {
           Log.d(TAG, "other error");
           this.fba.callbackContext.error("Dialog error: " + e.getMessage());
       }

       public void onCancel() {
           Log.d(TAG, "cancel");
           this.fba.callbackContext.success("cancelled");
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
            SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this.fba.cordova.getActivity());
            prefs.edit().putLong("access_expires", token_expires).commit();
            prefs.edit().putString("access_token", token).commit();

            Log.d(TAG, "authorized");

            Thread t = new Thread(new Runnable() {
                public void run() {
                    try {
                        JSONObject o = new JSONObject(fba.facebook.request("/me"));
                        fba.userId = o.getString("id");
                        fba.callbackContext.success(getResponse());
                    } catch (MalformedURLException e) {
                        e.printStackTrace();
                        fba.callbackContext.error("MalformedUrlException : " + e.getMessage());
                    } catch (IOException e) {
                        e.printStackTrace();
                        fba.callbackContext.error("IOException : " + e.getMessage());
                    } catch (JSONException e) {
                        e.printStackTrace();
                        fba.callbackContext.error("JSONException : " + e.getMessage());
                    }
                }
            });
            t.start();
        }

        public void onFacebookError(FacebookError e) {
            Log.d(TAG, "facebook error");
            this.fba.callbackContext.error("Facebook error: " + e.getMessage());
        }

        public void onError(DialogError e) {
            Log.d(TAG, "other error");
            this.fba.callbackContext.error("Dialog error: " + e.getMessage());
        }

        public void onCancel() {
            Log.d(TAG, "cancel");
            this.fba.callbackContext.success("cancelled");
        }
    }
}
