package org.apache.cordova.facebook;

import android.content.Intent;
import android.util.Log;
import com.facebook.Request;
import com.facebook.Response;
import com.facebook.Session;
import com.facebook.SessionState;
import com.facebook.model.GraphUser;
import java.util.HashMap;
import java.util.Map;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author Alessandro Polverini <alex@nibbles.it>
 */
public class ConnectPlugin extends CordovaPlugin {

  public final static String TAG = "Web/ConnectPlugin";
  CallbackContext lastCallbackContext;

  @Override
  public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {

    // TODO: Ask for extented permissions sent by the plugin call

    Session activeSession = Session.getActiveSession();
    if ("login".equals(action)) {
      Log.d(TAG, "[FACEBOOK] LOGIN");
      if (activeSession == null) {
        Log.d(TAG, "[FACEBOOK] ActiveSession NULL");
      } else {
        Log.d(TAG, "token: " + activeSession.getAccessToken());
        Log.d(TAG, "isClosed: " + activeSession.isClosed());
        Log.d(TAG, "isOpened: " + activeSession.isOpened());
        Log.d(TAG, "expirationDate: " + activeSession.getExpirationDate());
        SessionState state = activeSession.getState();
        Log.d(TAG, "state: " + state);
      }
      lastCallbackContext = callbackContext;
      cordova.setActivityResultCallback(this);
      cordova.getThreadPool().execute(new Runnable() {
        public void run() {
          Session.openActiveSession(cordova.getActivity(), true, new Session.StatusCallback() {
            // callback when session changes state
            @Override
            public void call(Session session, SessionState state, Exception exception) {
              Log.d(TAG, "[StatusCallback] SESSIONSTATE.isOpened: " + state.isOpened() + " token: " + session.getAccessToken());
              if (session.isOpened()) {
                if (lastCallbackContext != null) {
                  lastCallbackContext.success(getLoginStatus(session));
                  lastCallbackContext = null;
                }
              }
            }
          });
        }
      });
      PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
      pr.setKeepCallback(true);
      callbackContext.sendPluginResult(pr);

    } else if ("me".equals(action)) {
      Log.d(TAG, "Executing 'me' with activesession: " + activeSession + (activeSession != null ? activeSession.isOpened() : ""));
      if (activeSession == null || activeSession.isClosed()) {
        callbackContext.error("sessionClosed");
      } else {
        Request.executeMeRequestAsync(activeSession, new Request.GraphUserCallback() {
          // callback after Graph API response with user object
          @Override
          public void onCompleted(GraphUser user, Response response) {
            Log.d(TAG, "[me onCompleted] user: " + user + " response: " + response);
            if (user != null) {
              callbackContext.success(userToJSON(user));
            }
          }
        });
        PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
        pr.setKeepCallback(true);
        callbackContext.sendPluginResult(pr);
      }

    } else if ("logout".equals(action)) {
      boolean clearToken = args != null && args.optBoolean(0);
      Log.d(TAG, "FACEBOOK LOGOUT - clearToken: " + clearToken);
      if (activeSession != null) {
        if (clearToken) {
          activeSession.closeAndClearTokenInformation();
        } else {
          activeSession.close();
        }
      }
      callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, "logout"));

    } else if ("getLoginStatus".equals(action)) {
      Log.d(TAG, "LOGINSTATUS");
      callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, getLoginStatus(activeSession)));

    } else if ("init".equals(action)) {
      Log.i(TAG, "Deprecated call to init");
      // Do nothing, only for compatibility with old interface
      callbackContext.success();

    } else {
      return false;
    }
    return true;
  }

  public JSONObject userToJSON(GraphUser user) {
    Map<String, Object> response = new HashMap<String, Object>();
    response.put("id", user.getId());
    response.put("username", user.getUsername());
    response.put("name", user.getName());
    response.put("firstName", user.getFirstName());
    response.put("middleName", user.getMiddleName());
    response.put("lastName", user.getLastName());
    response.put("link", user.getLink());
    response.put("birthday", user.getBirthday());
    return new JSONObject(response);
  }

  public JSONObject getLoginStatus(Session fbSession) {
    Map<String, Object> response = new HashMap<String, Object>();
    if (fbSession != null && fbSession.isOpened()) {
      response.put("status", "connected");
      response.put("accessToken", fbSession.getAccessToken());
      response.put("expireTimeMs", fbSession.getExpirationDate().getTime());
      response.put("applicationId", fbSession.getApplicationId());
      response.put("permissions", fbSession.getPermissions());
    } else {
      response.put("status", "disconnected");
    }
    return new JSONObject(response);
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent intent) {
    super.onActivityResult(requestCode, resultCode, intent);
    Session activeSession = Session.getActiveSession();
    activeSession.onActivityResult(cordova.getActivity(), requestCode, resultCode, intent);
  }
}
