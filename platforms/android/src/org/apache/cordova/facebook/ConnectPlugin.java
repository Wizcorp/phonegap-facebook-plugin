package org.apache.cordova.facebook;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Currency;
import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CordovaInterface;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.facebook.AppEventsLogger;
import com.facebook.FacebookDialogException;
import com.facebook.FacebookException;
import com.facebook.FacebookOperationCanceledException;
import com.facebook.FacebookAuthorizationException;
import com.facebook.FacebookRequestError;
import com.facebook.FacebookServiceException;
import com.facebook.Request;
import com.facebook.Request.GraphUserCallback;
import com.facebook.Response;
import com.facebook.Session;
import com.facebook.SessionState;
import com.facebook.UiLifecycleHelper;
import com.facebook.model.GraphObject;
import com.facebook.model.GraphUser;
import com.facebook.widget.FacebookDialog;
import com.facebook.widget.WebDialog;
import com.facebook.widget.WebDialog.OnCompleteListener;

public class ConnectPlugin extends CordovaPlugin {

    private static final int INVALID_ERROR_CODE = -2; //-1 is FacebookRequestError.INVALID_ERROR_CODE
    private static final String PUBLISH_PERMISSION_PREFIX = "publish";
    private static final String MANAGE_PERMISSION_PREFIX = "manage";
    @SuppressWarnings("serial")
    private static final Set<String> OTHER_PUBLISH_PERMISSIONS = new HashSet<String>() {
        {
            add("ads_management");
            add("create_event");
            add("rsvp_event");
        }
    };
    private final String TAG = "ConnectPlugin";

    private AppEventsLogger logger;
    private String applicationId = null;
    private CallbackContext loginContext = null;
    private CallbackContext showDialogContext = null;
    private CallbackContext graphContext = null;
    private Bundle paramBundle;
    private String method;
    private String graphPath;
    private String userID;
    private UiLifecycleHelper uiHelper;
    private boolean trackingPendingCall = false;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        //Initialize UiLifecycleHelper
        uiHelper = new UiLifecycleHelper(cordova.getActivity(), null);

        // Init logger
        logger = AppEventsLogger.newLogger(cordova.getActivity());

        int appResId = cordova.getActivity().getResources().getIdentifier("fb_app_id", "string", cordova.getActivity().getPackageName());
        applicationId = cordova.getActivity().getString(appResId);

        // Set up the activity result callback to this class
        cordova.setActivityResultCallback(this);

        // Open a session if we have one cached
        Session session = new Session.Builder(cordova.getActivity()).setApplicationId(applicationId).build();
        if (session.getState() == SessionState.CREATED_TOKEN_LOADED) {
            Session.setActiveSession(session);
            // - Create the request
            Session.OpenRequest openRequest = new Session.OpenRequest(cordova.getActivity());
            // - Set the status change call back
            openRequest.setCallback(new Session.StatusCallback() {
                @Override
                public void call(Session session, SessionState state, Exception exception) {
                    onSessionStateChange(state, exception);
                }
            });
            session.openForRead(openRequest);
        }

        // If we have a valid open session, get user's info
        if (checkActiveSession(session)) {
            // Call this method to initialize the session state info
            onSessionStateChange(session.getState(), null);
        }
        super.initialize(cordova, webView);
    }

    @Override
    public void onResume(boolean multitasking) {
        super.onResume(multitasking);
        uiHelper.onResume();
        // Developers can observe how frequently users activate their app by logging an app activation event.
        AppEventsLogger.activateApp(cordova.getActivity());
    }

    protected void onSaveInstanceState(Bundle outState) {
        uiHelper.onSaveInstanceState(outState);
    }

    public void onPause() {
        uiHelper.onPause();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        uiHelper.onDestroy();
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        Log.d(TAG, "activity result in plugin: requestCode(" + requestCode + "), resultCode(" + resultCode + ")");
        if (trackingPendingCall) {
            uiHelper.onActivityResult(requestCode, resultCode, intent, new FacebookDialog.Callback() {
                @Override
                public void onError(FacebookDialog.PendingCall pendingCall, Exception error, Bundle data) {
                    Log.e("Activity", String.format("Error: %s", error.toString()));
                    handleError(error, showDialogContext);
                }

                @Override
                public void onComplete(FacebookDialog.PendingCall pendingCall, Bundle data) {
                    Log.i("Activity", "Success!");
                    handleSuccess(data);
                }
            });
        } else {
            Session session = Session.getActiveSession();
            if (session != null && loginContext != null) {
                session.onActivityResult(cordova.getActivity(), requestCode, resultCode, intent);
            }
        }
        trackingPendingCall = false;
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        if (action.equals("login")) {
            Log.d(TAG, "login FB");
            // Get the permissions
            String[] arrayPermissions = new String[args.length()];
            for (int i = 0; i < args.length(); i++) {
                arrayPermissions[i] = args.getString(i);
            }

            List<String> permissions = null;
            if (arrayPermissions.length > 0) {
                permissions = Arrays.asList(arrayPermissions);
            }

            // Get the currently active session
            Session session = Session.getActiveSession();

            // Set a pending callback to cordova
            loginContext = callbackContext;
            PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
            pr.setKeepCallback(true);
            loginContext.sendPluginResult(pr);

            // Check if the active session is open
            if (checkActiveSession(session)) {
                // Reauthorize flow
                boolean publishPermissions = false;
                boolean readPermissions = false;
                // Figure out if this will be a read or publish reauthorize
                if (permissions == null) {
                    // No permissions, read
                    readPermissions = true;
                }
                // Loop through the permissions to see what
                // is being requested
                for (String permission : arrayPermissions) {
                    if (isPublishPermission(permission)) {
                        publishPermissions = true;
                    } else {
                        readPermissions = true;
                    }
                    // Break if we have a mixed bag, as this is an error
                    if (publishPermissions && readPermissions) {
                        break;
                    }
                }
                if (publishPermissions && readPermissions) {
                    callbackContext.error("Cannot ask for both read and publish permissions.");
                } else {
                    // Set up the new permissions request
                    Session.NewPermissionsRequest newPermissionsRequest = new Session.NewPermissionsRequest(cordova.getActivity(), permissions);
                    // Set up the activity result callback to this class
                    cordova.setActivityResultCallback(this);
                    // Check for write permissions, the default is read (empty)
                    if (publishPermissions) {
                        // Request new publish permissions
                        session.requestNewPublishPermissions(newPermissionsRequest);
                    } else {
                        // Request new read permissions
                        session.requestNewReadPermissions(newPermissionsRequest);
                    }
                }
            } else {
                // Initial login, build a new session open request.

                // - Create a new session and set the application ID
                session = new Session.Builder(cordova.getActivity()).setApplicationId(applicationId).build();
                // Set up the activity result callback to this class
                cordova.setActivityResultCallback(this);

                Session.setActiveSession(session);
                // - Create the request
                Session.OpenRequest openRequest = new Session.OpenRequest(cordova.getActivity());
                // - Set the permissions
                openRequest.setPermissions(permissions);
                // - Set the status change call back
                openRequest.setCallback(new Session.StatusCallback() {
                    @Override
                    public void call(Session session, SessionState state, Exception exception) {
                        onSessionStateChange(state, exception);
                    }
                });

                // Can only ask for read permissions initially
                session.openForRead(openRequest);
            }
            return true;
        } else if (action.equals("logout")) {

            Session session = Session.getActiveSession();
            if (checkActiveSession(session)) {
                session.closeAndClearTokenInformation();
                userID = null;
                callbackContext.success();
            } else {
                if (session != null) {
                    // Session was existing, but was not open
                    callbackContext.error("Session not open.");
                } else {
                    callbackContext.error("No valid session found, must call init and login before logout.");
                }
            }
            return true;
        } else if (action.equals("getLoginStatus")) {
            Session session = Session.getActiveSession();
            if (userID == null && Session.getActiveSession() != null  && session.isOpened()) {
                // We have no userID but a valid session, so must update the user info
                // (Probably app was force stopped)
                final CallbackContext _callbackContext = callbackContext;
                getUserInfo(session, new GraphUserCallback() {
                    @Override
                    public void onCompleted(GraphUser user, Response response) {
                        // Request completed, userID was updated,
                        // recursive call to generate the correct response JSON
                        if (response.getError() != null) {
                            _callbackContext.error(getFacebookRequestErrorResponse(response.getError()));
                        } else {
                            userID = user.getId();
                            _callbackContext.success(getResponse());
                        }
                    }
                });
            } else {
                callbackContext.success(getResponse());
            }
            return true;
        } else if (action.equals("getAccessToken")) {
            Session session = Session.getActiveSession();
            if (checkActiveSession(session)) {
                callbackContext.success(session.getAccessToken());
            } else {
                if (session == null) {
                    callbackContext.error("No valid session found, must call init and login before logout.");
                } else {
                    // Session not open
                    callbackContext.error("Session not open.");
                }
            }
            return true;
        } else if (action.equals("logEvent")) {
            if (args.length() == 0) {
                // Not enough parameters
                callbackContext.error("Invalid arguments");
                return true;
            }
            String eventName = args.getString(0);
            if (args.length() == 1) {
                logger.logEvent(eventName);
            } else {
                // Arguments is greater than 1
                JSONObject params = args.getJSONObject(1);
                Bundle parameters = new Bundle();

                Iterator<?> iterator = params.keys();
                while (iterator.hasNext()) {
                    try {
                        // Try get a String
                        String key = (String) iterator.next();
                        String value = params.getString(key);
                        parameters.putString(key, value);
                    } catch (Exception e) {
                        // Maybe it was an int
                        Log.w(TAG, "Type in AppEvent parameters was not String for key: " + (String) iterator.next());
                        try {
                            String key = (String) iterator.next();
                            int value = params.getInt(key);
                            parameters.putInt(key, value);
                        } catch (Exception e2) {
                            // Nope
                            Log.e(TAG, "Unsupported type in AppEvent parameters for key: " + (String) iterator.next());
                        }
                    }
                }
                if (args.length() == 2) {
                    logger.logEvent(eventName, parameters);
                }
                if (args.length() == 3) {
                    double value = args.getDouble(2);
                    logger.logEvent(eventName, value, parameters);
                }
            }
            callbackContext.success();
            return true;
        } else if (action.equals("logPurchase")) {
            /*
             * While calls to logEvent can be made to register purchase events,
             * there is a helper method that explicitly takes a currency indicator.
             */
            if (args.length() != 2) {
                callbackContext.error("Invalid arguments");
                return true;
            }
            int value = args.getInt(0);
            String currency = args.getString(1);
            logger.logPurchase(BigDecimal.valueOf(value), Currency.getInstance(currency));
            callbackContext.success();
            return true;
        } else if (action.equals("showDialog")) {
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
            this.paramBundle = new Bundle(collect);
            
            //The Share dialog prompts a person to publish an individual story or an Open Graph story to their timeline.
            //This does not require Facebook Login or any extended permissions, so it is the easiest way to enable sharing on web.
            boolean isShareDialog = this.method.equalsIgnoreCase("share") || this.method.equalsIgnoreCase("share_open_graph");
            //If is a Share dialog but FB app is not installed the WebDialog Builder fails. 
            //In Android all WebDialogs require a not null Session object.
            boolean canPresentShareDialog = isShareDialog && (FacebookDialog.canPresentShareDialog(me.cordova.getActivity(), FacebookDialog.ShareDialogFeature.SHARE_DIALOG));
            //Must be an active session when is not a Shared dialog or if the Share dialog cannot be presented.
            boolean requiresAnActiveSession = (!isShareDialog) || (!canPresentShareDialog);
            if (requiresAnActiveSession) {
                Session session = Session.getActiveSession();
                if (!checkActiveSession(session)) {
                    callbackContext.error("No active session");
                    return true;
                }
            }

            // Begin by sending a callback pending notice to Cordova
            showDialogContext = callbackContext;
            PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
            pr.setKeepCallback(true);
            showDialogContext.sendPluginResult(pr);

            // Setup callback context
            final OnCompleteListener dialogCallback = new OnCompleteListener() {

                @Override
                public void onComplete(Bundle values, FacebookException exception) {
                    if (exception != null) {
                        handleError(exception, showDialogContext);
                    } else {
                        handleSuccess(values);
                    }
                }
            };

            if (this.method.equalsIgnoreCase("feed")) {
                Runnable runnable = new Runnable() {
                    public void run() {
                        WebDialog feedDialog = (new WebDialog.FeedDialogBuilder(me.cordova.getActivity(), Session.getActiveSession(), paramBundle)).setOnCompleteListener(dialogCallback).build();
                        feedDialog.show();
                    }
                };
                cordova.getActivity().runOnUiThread(runnable);
            } else if (this.method.equalsIgnoreCase("apprequests")) {
                Runnable runnable = new Runnable() {
                    public void run() {
                        WebDialog requestsDialog = (new WebDialog.RequestsDialogBuilder(me.cordova.getActivity(), Session.getActiveSession(), paramBundle)).setOnCompleteListener(dialogCallback)
                            .build();
                        requestsDialog.show();
                    }
                };
                cordova.getActivity().runOnUiThread(runnable);
            } else if (isShareDialog) {
                if (canPresentShareDialog) {
                    Runnable runnable = new Runnable() {
                        public void run() {
                            // Publish the post using the Share Dialog
                            FacebookDialog shareDialog = new FacebookDialog.ShareDialogBuilder(me.cordova.getActivity())
                                .setName(paramBundle.getString("name"))
                                .setCaption(paramBundle.getString("caption"))
                                .setDescription(paramBundle.getString("description"))
                                .setLink(paramBundle.getString("href"))
                                .setPicture(paramBundle.getString("picture"))
                                .build();
                            uiHelper.trackPendingDialogCall(shareDialog.present());
                        }
                    };
                    this.trackingPendingCall = true;
                    cordova.getActivity().runOnUiThread(runnable);
                } else {
                    // Fallback. For example, publish the post using the Feed Dialog
                    Runnable runnable = new Runnable() {
                        public void run() {
                            WebDialog feedDialog = (new WebDialog.FeedDialogBuilder(me.cordova.getActivity(), Session.getActiveSession(), paramBundle)).setOnCompleteListener(dialogCallback).build();
                            feedDialog.show();
                        }
                    };
                    cordova.getActivity().runOnUiThread(runnable);
                }
            } else if (this.method.equalsIgnoreCase("send")) {
                Runnable runnable = new Runnable() {
                    public void run() {
                        FacebookDialog.MessageDialogBuilder builder = new FacebookDialog.MessageDialogBuilder(me.cordova.getActivity());
                        if(paramBundle.containsKey("link"))
                            builder.setLink(paramBundle.getString("link"));
                        if(paramBundle.containsKey("caption"))
                            builder.setCaption(paramBundle.getString("caption"));
                        if(paramBundle.containsKey("name"))
                            builder.setName(paramBundle.getString("name"));
                        if(paramBundle.containsKey("picture"))
                            builder.setPicture(paramBundle.getString("picture"));
                        if(paramBundle.containsKey("description"))
                            builder.setDescription(paramBundle.getString("description"));
                        // Check for native FB Messenger application
                        if (builder.canPresent()) {
                            FacebookDialog dialog = builder.build();
                            dialog.present();
                        }  else {
                            // Not found
                            trackingPendingCall = false;
                            String errMsg = "Messaging unavailable.";
                            Log.e(TAG, errMsg);
                            showDialogContext.error(errMsg);
                        }
                    };
                };
                this.trackingPendingCall = true;
                cordova.getActivity().runOnUiThread(runnable);
            } else {
                callbackContext.error("Unsupported dialog method.");
            }
            return true;
        } else if (action.equals("graphApi")) {
            graphContext = callbackContext;
            PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
            pr.setKeepCallback(true);
            graphContext.sendPluginResult(pr);

            graphPath = args.getString(0);

            JSONArray arr = args.getJSONArray(1);

            final List<String> permissionsList = new ArrayList<String>();
            for (int i = 0; i < arr.length(); i++) {
                permissionsList.add(arr.getString(i));
            }

            boolean publishPermissions = false;
            boolean readPermissions = false;
            if (permissionsList.size() > 0) {
                for (String permission : permissionsList) {
                    if (isPublishPermission(permission)) {
                        publishPermissions = true;
                    } else {
                        readPermissions = true;
                    }
                    // Break if we have a mixed bag, as this is an error
                    if (publishPermissions && readPermissions) {
                        break;
                    }
                }
                if (publishPermissions && readPermissions) {
                    graphContext.error("Cannot ask for both read and publish permissions.");
                } else {
                    Session session = Session.getActiveSession();
                    if (session.getPermissions().containsAll(permissionsList)) {
                        makeGraphCall();
                    } else {
                        // Set up the new permissions request
                        Session.NewPermissionsRequest newPermissionsRequest = new Session.NewPermissionsRequest(cordova.getActivity(), permissionsList);
                        // Set up the activity result callback to this class
                        cordova.setActivityResultCallback(this);
                        // Check for write permissions, the default is read (empty)
                        if (publishPermissions) {
                            // Request new publish permissions
                            session.requestNewPublishPermissions(newPermissionsRequest);
                        } else {
                            // Request new read permissions
                            session.requestNewReadPermissions(newPermissionsRequest);
                        }
                    }
                }
            } else {
                makeGraphCall();
            }
            return true;
        }
        return false;
    }

    // Simple active session check
    private boolean checkActiveSession(Session session) {
        if (session != null && session.isOpened()) {
            return true;
        } else {
            return false;
        }
    }

    private void handleError(Exception exception, CallbackContext context) {
        String errMsg = "Facebook error: " + exception.getMessage();
        int errorCode = INVALID_ERROR_CODE;
        // User clicked "x"
        if (exception instanceof FacebookOperationCanceledException) {
            errMsg = "User cancelled dialog";
            errorCode = 4201;
        } else if (exception instanceof FacebookDialogException) {
            // Dialog error
            errMsg = "Dialog error: " + exception.getMessage();
        }

        Log.e(TAG, exception.toString());
        context.error(getErrorResponse(exception, errMsg, errorCode));
    }

    private void handleSuccess(Bundle values) {
        // Handle a successful dialog:
        // Send the URL parameters back, for a requests dialog, the "request" parameter
        // will include the resulting request id. For a feed dialog, the "post_id"
        // parameter will include the resulting post id.
        // Note: If the user clicks on the Cancel button, the parameter will be empty
        if (values.size() > 0) {
            JSONObject response = new JSONObject();
            try {
                Set<String> keys = values.keySet();
                for (String key : keys) {
                    //check if key is array
                    int beginArrayCharIndex = key.indexOf("[");
                    if (beginArrayCharIndex >= 0) {
                        String normalizedKey = key.substring(0, beginArrayCharIndex);
                        JSONArray result;
                        if (response.has(normalizedKey)) {
                            result = (JSONArray) response.get(normalizedKey);
                        } else {
                            result = new JSONArray();
                            response.put(normalizedKey, result);
                        }
                        result.put(result.length(), values.get(key));
                    } else {
                        response.put(key, values.get(key));
                    }
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
            showDialogContext.success(response);
        } else {
            Log.e(TAG, "User cancelled dialog");
            showDialogContext.error("User cancelled dialog");
        }
    }

    private void getUserInfo(final Session session, final Request.GraphUserCallback graphUserCb) {
        if (cordova != null) {
            Request.newMeRequest(session, graphUserCb).executeAsync();
        }
    }

    private void makeGraphCall() {
        Session session = Session.getActiveSession();

        Request.Callback graphCallback = new Request.Callback() {

            @Override
            public void onCompleted(Response response) {
                if (graphContext != null) {
                    if (response.getError() != null) {
                        graphContext.error(getFacebookRequestErrorResponse(response.getError()));
                    } else {
                        GraphObject graphObject = response.getGraphObject();
                        graphContext.success(graphObject.getInnerJSONObject());
                    }
                    graphPath = null;
                    graphContext = null;
                }
            }
        };

        //If you're using the paging URLs they will be URLEncoded, let's decode them.
        try {
            graphPath = URLDecoder.decode(graphPath, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }

        String[] urlParts = graphPath.split("\\?");
        String graphAction = urlParts[0];
        Request graphRequest = Request.newGraphPathRequest(null, graphAction, graphCallback);
        Bundle params = graphRequest.getParameters();

        if (urlParts.length > 1) {
            String[] queries = urlParts[1].split("&");

            for (String query : queries) {
                int splitPoint = query.indexOf("=");
                if (splitPoint > 0) {
                    String key = query.substring(0, splitPoint);
                    String value = query.substring(splitPoint + 1, query.length());
                    params.putString(key, value);
                }
            }
        }
        params.putString("access_token", session.getAccessToken());

        graphRequest.setParameters(params);
        graphRequest.executeAsync();
    }

    /*
     * Handles session state changes
     */
    private void onSessionStateChange(SessionState state, Exception exception) {
        Log.d(TAG, "onSessionStateChange:" + state.toString());
        if (exception != null && exception instanceof FacebookOperationCanceledException) {
            // only handle FacebookOperationCanceledException to support
            // SDK recovery behavior triggered by getUserInfo
            Log.e(TAG, "exception:" + exception.toString());
            handleError(exception, loginContext);
        } else {
            final Session session = Session.getActiveSession();
            // Check if the session is open
            if (state.isOpened()) {
                if (loginContext != null) {
                    // Get user info
                    getUserInfo(session, new Request.GraphUserCallback() {
                        @Override
                        public void onCompleted(GraphUser user, Response response) {
                            // Create a new result with response data
                            if (loginContext != null) {
                                if (response.getError() != null) {
                                    loginContext.error(getFacebookRequestErrorResponse(response.getError()));
                                } else {
                                    GraphObject graphObject = response.getGraphObject();
                                    Log.d(TAG, "returning login object " + graphObject.getInnerJSONObject().toString());
                                    userID = user.getId();
                                    loginContext.success(getResponse());
                                    loginContext = null;
                                }
                            } else {
                                // Just update the userID in case we force quit the application before
                                userID = user.getId();
                            }
                        }
                    });
                } else if (graphContext != null) {
                    // Make the graph call
                    makeGraphCall();
                }
            } else if (state == SessionState.CLOSED_LOGIN_FAILED && loginContext != null){
                handleError(new FacebookAuthorizationException("Session was closed and was not closed normally"), loginContext);
            }
        }
    }

    /*
     * Checks for publish permissions
     */
    private boolean isPublishPermission(String permission) {
        return permission != null && (permission.startsWith(PUBLISH_PERMISSION_PREFIX) || permission.startsWith(MANAGE_PERMISSION_PREFIX) || OTHER_PUBLISH_PERMISSIONS.contains(permission));
    }

    /**
     * Create a Facebook Response object that matches the one for the Javascript SDK
     * @return JSONObject - the response object
     */
    public JSONObject getResponse() {
        String response;
        final Session session = Session.getActiveSession();
        if (checkActiveSession(session)) {
            Date today = new Date();
            long expiresTimeInterval = (session.getExpirationDate().getTime() - today.getTime()) / 1000L;
            long expiresIn = (expiresTimeInterval > 0) ? expiresTimeInterval : 0;
            response = "{"
                + "\"status\": \"connected\","
                + "\"authResponse\": {"
                + "\"accessToken\": \"" + session.getAccessToken() + "\","
                + "\"expiresIn\": \"" + expiresIn + "\","
                + "\"session_key\": true,"
                + "\"sig\": \"...\","
                + "\"userID\": \"" + userID + "\""
                + "}"
                + "}";
        } else {
            response = "{"
                + "\"status\": \"unknown\""
                + "}";
        }
        try {
            return new JSONObject(response);
        } catch (JSONException e) {

            e.printStackTrace();
        }
        return new JSONObject();
    }

    public JSONObject getFacebookRequestErrorResponse(FacebookRequestError error) {

        String response = "{"
            + "\"errorCode\": \"" + error.getErrorCode() + "\","
            + "\"errorType\": \"" + error.getErrorType() + "\","
            + "\"errorMessage\": \"" + error.getErrorMessage() + "\"";

        int messageId = error.getUserActionMessageId();

        // Check for INVALID_MESSAGE_ID
        if (messageId != 0) {
            String errorUserMessage = cordova.getActivity().getResources().getString(messageId);
            // Safe check for null
            if (errorUserMessage != null) {
                    response += ",\"errorUserMessage\": \"" + cordova.getActivity().getResources().getString(error.getUserActionMessageId()) + "\"";
            }
        }

        response += "}";

        try {
            return new JSONObject(response);
        } catch (JSONException e) {

            e.printStackTrace();
        }
        return new JSONObject();
    }

    public JSONObject getErrorResponse(Exception error, String message, int errorCode) {

        if (error instanceof FacebookServiceException) {
            return getFacebookRequestErrorResponse(((FacebookServiceException) error).getRequestError());
        }

        String response = "{";

        if (error instanceof FacebookDialogException) {
            errorCode = ((FacebookDialogException) error).getErrorCode();
        }

        if (errorCode != INVALID_ERROR_CODE) {
            response += "\"errorCode\": \"" + errorCode + "\",";
        }

        if (message == null) {
            message = error.getMessage();
        }

        response += "\"errorMessage\": \"" + message + "\"}";

        try {
            return new JSONObject(response);
        } catch (JSONException e) {

            e.printStackTrace();
        }
        return new JSONObject();
    }
}
