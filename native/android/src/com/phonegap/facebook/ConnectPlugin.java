package com.phonegap.facebook;

import java.io.IOException;
import java.net.MalformedURLException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;

import com.facebook.android.DialogError;
import com.facebook.android.Facebook;
import com.facebook.android.Facebook.DialogListener;
import com.facebook.android.FacebookError;
import com.phonegap.api.Plugin;
import com.phonegap.api.PluginResult;

public class ConnectPlugin extends Plugin {

    Facebook facebook;
    String userId;
    String appSecret;

    @Override
    public PluginResult execute(String action, JSONArray args, final String callbackId) {
        PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
        pr.setKeepCallback(true);
        if (action.equals("init")) {
            try {
                facebook = new Facebook(args.getString(0));
                appSecret = this.ctx.getPackageManager().getApplicationInfo(this.ctx.getPackageName(),
                        PackageManager.GET_META_DATA).metaData.getString("app_secret");

                return new PluginResult(PluginResult.Status.OK);
            } catch (JSONException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
                return new PluginResult(PluginResult.Status.ERROR, "Invalid JSON args used. expected a string as the first arg.");
            } catch (NameNotFoundException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
                return new PluginResult(PluginResult.Status.ERROR, "You need to define the app_secret in your Android Manifest like this.");
            }
        } else if (action.equals("login")) {
            if (facebook != null) {
                if (facebook.isSessionValid()) {
                    Log.d("FB", "Session already valid");
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
                    this.facebook.authorize(this.ctx, permissions, 1234567890, new DialogListener() {
                        @Override
                        public void onComplete(Bundle values) {
                            Log.d("FB", "authorized");
                            try {
                                JSONObject o = new JSONObject(me.facebook.request("/me"));
                                me.userId = o.getString("id");
                                me.success(getResponse(), callbackId);
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

                        @Override
                        public void onFacebookError(FacebookError error) {
                            Log.d("FB", "facebook error");
                            me.error("Facebook error: " + error.getMessage(), callbackId);
                        }

                        @Override
                        public void onError(DialogError e) {
                            Log.d("FB", "other error");
                            me.error("Dialog error: " + e.getMessage(), callbackId);
                        }

                        @Override
                        public void onCancel() {
                            Log.d("FB", "cancel");
                            me.error("Cancelled", callbackId);
                        }
                    });
                }
            } else {
                pr = new PluginResult(PluginResult.Status.ERROR, "Must call FB.init before FB.login");
            }
        } else if (action.equals("logout")) {
            if (facebook != null) {
                try {
                    facebook.logout(this.ctx);
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
            }
        } else if (action.equals("getLoginStatus")) {
            if (facebook != null) {
                pr = new PluginResult(PluginResult.Status.OK, getResponse());
            }
        }
        return pr;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        facebook.authorizeCallback(requestCode, resultCode, data);
    }

    /**
     * Compose JSON representation of a full response object.
     *
     * Response object must be similar to the object returned by FB.getLoginStatus()
     * method from Facebook Javascript SDK.
     *
     * @todo Port to <a href="http://developers.facebook.com/docs/oauth2-https-migration/">OAuth 2.0</a>
     * @todo Add signed_request to authResponse
     *
     * @see <a href="http://developers.facebook.com/docs/authentication/signed_request/">
     *      Facebook's signed_request parameter</a>
     * @see <a href="http://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus/">
     *      Section 'Response and Session objects' in 'FB.getLoginStatus' for details about response object</a>
     * @see <a href="https://github.com/facebook/facebook-android-sdk/blob/master/facebook/src/com/facebook/android/Facebook.java">
     *      com.facebook.android.Facebook class from Facebook Android SDK</a>
     */
    public JSONObject getResponse() {
        String response = "{"+
        "    \"status\": \""+(facebook.isSessionValid() ? "connected" : "unknown")+"\","+
        "    \"authResponse\": {"+
        "        \"accessToken\": \""+facebook.getAccessToken()+"\","+
        "        \"expiresIn\": \""+facebook.getAccessExpires()+"\","+
        "        \"userID\": \""+this.userId+"\""+
        "    }"+
        "}";

        try {
            return new JSONObject(response);
        } catch (JSONException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return new JSONObject();
    }
}
