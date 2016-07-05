package org.apache.cordova.facebook;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import com.facebook.AccessToken;
import com.facebook.CallbackManager;
import com.facebook.FacebookCallback;
import com.facebook.FacebookDialogException;
import com.facebook.FacebookException;
import com.facebook.FacebookOperationCanceledException;
import com.facebook.FacebookRequestError;
import com.facebook.FacebookSdk;
import com.facebook.FacebookServiceException;
import com.facebook.GraphRequest;
import com.facebook.GraphResponse;
import com.facebook.appevents.AppEventsLogger;
import com.facebook.login.LoginManager;
import com.facebook.login.LoginResult;
import com.facebook.share.ShareApi;
import com.facebook.share.Sharer;
import com.facebook.share.model.GameRequestContent;
import com.facebook.share.model.ShareLinkContent;
import com.facebook.share.model.ShareOpenGraphObject;
import com.facebook.share.model.ShareOpenGraphAction;
import com.facebook.share.model.ShareOpenGraphContent;
import com.facebook.share.model.AppInviteContent;
import com.facebook.share.widget.GameRequestDialog;
import com.facebook.share.widget.MessageDialog;
import com.facebook.share.widget.ShareDialog;
import com.facebook.share.widget.AppInviteDialog;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.lang.System;
import java.math.BigDecimal;
import java.net.URLDecoder;
import java.util.Collection;
import java.util.Currency;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

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

    private CallbackManager callbackManager;
    private AppEventsLogger logger;
    private CallbackContext loginContext = null;
    private CallbackContext showDialogContext = null;
    private CallbackContext graphContext = null;
    private String graphPath;
    private ShareDialog shareDialog;
    private GameRequestDialog gameRequestDialog;
    private AppInviteDialog appInviteDialog;
    private MessageDialog messageDialog;

    @Override
    protected void pluginInitialize() {
        FacebookSdk.sdkInitialize(cordova.getActivity().getApplicationContext());

        // create callbackManager
        callbackManager = CallbackManager.Factory.create();

        // create AppEventsLogger
        logger = AppEventsLogger.newLogger(cordova.getActivity().getApplicationContext());

        // Set up the activity result callback to this class
        cordova.setActivityResultCallback(this);

        LoginManager.getInstance().registerCallback(callbackManager, new FacebookCallback<LoginResult>() {
            @Override
            public void onSuccess(final LoginResult loginResult) {
                GraphRequest.newMeRequest(loginResult.getAccessToken(), new GraphRequest.GraphJSONObjectCallback() {
                    @Override
                    public void onCompleted(JSONObject jsonObject, GraphResponse response) {
                        if (response.getError() != null) {
                            if (graphContext != null) {
                                graphContext.error(getFacebookRequestErrorResponse(response.getError()));
                            } else if (loginContext != null) {
                                loginContext.error(getFacebookRequestErrorResponse(response.getError()));
                            }
                            return;
                        }

                        // If this login comes after doing a new permission request
                        // make the outstanding graph call
                        if (graphContext != null) {
                            makeGraphCall();
                            return;
                        }

                        Log.d(TAG, "returning login object " + jsonObject.toString());
                        loginContext.success(getResponse());
                        loginContext = null;
                    }
                }).executeAsync();
            }

            @Override
            public void onCancel() {
                FacebookOperationCanceledException e = new FacebookOperationCanceledException();
                handleError(e, loginContext);
            }

            @Override
            public void onError(FacebookException e) {
                Log.e("Activity", String.format("Error: %s", e.toString()));
                handleError(e, loginContext);
            }
        });

        shareDialog = new ShareDialog(cordova.getActivity());
        shareDialog.registerCallback(callbackManager, new FacebookCallback<Sharer.Result>() {
            @Override
            public void onSuccess(Sharer.Result result) {
                if (showDialogContext != null) {
                    showDialogContext.success(result.getPostId());
                    showDialogContext = null;
                }
            }

            @Override
            public void onCancel() {
                FacebookOperationCanceledException e = new FacebookOperationCanceledException();
                handleError(e, showDialogContext);
            }

            @Override
            public void onError(FacebookException e) {
                Log.e("Activity", String.format("Error: %s", e.toString()));
                handleError(e, showDialogContext);
            }
        });

        messageDialog = new MessageDialog(cordova.getActivity());
        messageDialog.registerCallback(callbackManager, new FacebookCallback<Sharer.Result>() {
            @Override
            public void onSuccess(Sharer.Result result) {
                if (showDialogContext != null) {
                    showDialogContext.success();
                    showDialogContext = null;
                }
            }

            @Override
            public void onCancel() {
                FacebookOperationCanceledException e = new FacebookOperationCanceledException();
                handleError(e, showDialogContext);
            }

            @Override
            public void onError(FacebookException e) {
                Log.e("Activity", String.format("Error: %s", e.toString()));
                handleError(e, showDialogContext);
            }
        });

        gameRequestDialog = new GameRequestDialog(cordova.getActivity());
        gameRequestDialog.registerCallback(callbackManager, new FacebookCallback<GameRequestDialog.Result>() {
            @Override
            public void onSuccess(GameRequestDialog.Result result) {
                if (showDialogContext != null) {
                    try {
                        JSONObject json = new JSONObject();
                        json.put("requestId", result.getRequestId());
                        json.put("recipientsIds", new JSONArray(result.getRequestRecipients()));
                        showDialogContext.success(json);
                        showDialogContext = null;
                    } catch (JSONException ex) {
                        showDialogContext.success();
                        showDialogContext = null;
                    }
                }
            }

            @Override
            public void onCancel() {
                FacebookOperationCanceledException e = new FacebookOperationCanceledException();
                handleError(e, showDialogContext);
            }

            @Override
            public void onError(FacebookException e) {
                Log.e("Activity", String.format("Error: %s", e.toString()));
                handleError(e, showDialogContext);
            }
        });

        appInviteDialog = new AppInviteDialog(cordova.getActivity());
        appInviteDialog.registerCallback(callbackManager, new FacebookCallback<AppInviteDialog.Result>() {
            @Override
            public void onSuccess(AppInviteDialog.Result result) {
                if (showDialogContext != null) {
                    try {
                        JSONObject json = new JSONObject();
                        Bundle bundle = result.getData();
                        for (String key : bundle.keySet()) {
                            json.put(key, wrapObject(bundle.get(key)));
                        }

                        showDialogContext.success(json);
                        showDialogContext = null;
                    } catch (JSONException e) {
                        showDialogContext.success();
                        showDialogContext = null;
                    }
                }
            }

            @Override
            public void onCancel() {
                FacebookOperationCanceledException e = new FacebookOperationCanceledException();
                handleError(e, showDialogContext);
            }

            @Override
            public void onError(FacebookException e) {
                Log.e("Activity", String.format("Error: %s", e.toString()));
                handleError(e, showDialogContext);
            }
        });
    }

    @Override
    public void onResume(boolean multitasking) {
        super.onResume(multitasking);
        // Developers can observe how frequently users activate their app by logging an app activation event.
        AppEventsLogger.activateApp(cordova.getActivity());
    }

    @Override
    public void onPause(boolean multitasking) {
        super.onPause(multitasking);
        AppEventsLogger.deactivateApp(cordova.getActivity());
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        Log.d(TAG, "activity result in plugin: requestCode(" + requestCode + "), resultCode(" + resultCode + ")");
        callbackManager.onActivityResult(requestCode, resultCode, intent);
    }

    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
        if (action.equals("login")) {
            executeLogin(args, callbackContext);
            return true;

        } else if (action.equals("logout")) {
            if (hasAccessToken()) {
                LoginManager.getInstance().logOut();
                callbackContext.success();
            } else {
                callbackContext.error("No valid session found, must call init and login before logout.");
            }
            return true;

        } else if (action.equals("getLoginStatus")) {
            callbackContext.success(getResponse());
            return true;

        } else if (action.equals("getAccessToken")) {
            if (hasAccessToken()) {
                callbackContext.success(AccessToken.getCurrentAccessToken().getToken());
            } else {
                // Session not open
                callbackContext.error("Session not open.");
            }
            return true;

        } else if (action.equals("logEvent")) {
            executeLogEvent(args, callbackContext);
            return true;

        } else if (action.equals("getApplicationSignature")) {
            String sig = FacebookSdk.getApplicationSignature(webView.getContext());
            if (sig == null) {
                callbackContext.error("Could not determine signature.");
            } else {
                // strip the linefeed..
                sig = sig.replace(System.lineSeparator(), "");
                // .. and pad the result with ='s because it needs to be 28 bytes per Fb's requirements
                while (sig.length() < 28) {
                    sig += "=";
                }
            }
            Log.w(TAG, "getApplicationSignature result: " + sig);
            callbackContext.success(sig);
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
            executeDialog(args, callbackContext);
            return true;

        } else if (action.equals("graphApi")) {
            executeGraph(args, callbackContext);

            return true;
        } else if (action.equals("appInvite")) {
            executeAppInvite(args, callbackContext);

            return true;
        } else if (action.equals("activateApp")) {
            cordova.getThreadPool().execute(new Runnable() {
                @Override
                public void run() {
                    AppEventsLogger.activateApp(cordova.getActivity());
                }
            });
            
            return true;
        }
        return false;
    }

    private void executeAppInvite(JSONArray args, CallbackContext callbackContext) {
        String url = null;
        String picture = null;
        JSONObject parameters;

        try {
            parameters = args.getJSONObject(0);
        } catch (JSONException e) {
            parameters = new JSONObject();
        }

        if (parameters.has("url")) {
            try {
                url = parameters.getString("url");
            } catch (JSONException e) {
                Log.e(TAG, "Non-string 'url' parameter provided to dialog");
                callbackContext.error("Incorrect 'url' parameter");
                return;
            }
        } else {
            callbackContext.error("Missing required 'url' parameter");
            return;
        }

        if (parameters.has("picture")) {
            try {
                picture = parameters.getString("picture");
            } catch (JSONException e) {
                Log.e(TAG, "Non-string 'picture' parameter provided to dialog");
                callbackContext.error("Incorrect 'picture' parameter");
                return;
            }
        }

        if (AppInviteDialog.canShow()) {
            AppInviteContent.Builder builder = new AppInviteContent.Builder();
            builder.setApplinkUrl(url);
            if (picture != null) {
                builder.setPreviewImageUrl(picture);
            }

            showDialogContext = callbackContext;
            PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
            pr.setKeepCallback(true);
            showDialogContext.sendPluginResult(pr);

            cordova.setActivityResultCallback(this);
            appInviteDialog.show(builder.build());
        } else {
            callbackContext.error("Unable to show dialog");
        }
    }

    private void executeDialog(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Map<String, String> params = new HashMap<String, String>();
        String method = null;
        JSONObject parameters;

        try {
            parameters = args.getJSONObject(0);
        } catch (JSONException e) {
            parameters = new JSONObject();
        }

        Iterator<String> iter = parameters.keys();
        while (iter.hasNext()) {
            String key = iter.next();
            if (key.equals("method")) {
                try {
                    method = parameters.getString(key);
                } catch (JSONException e) {
                    Log.w(TAG, "Nonstring method parameter provided to dialog");
                }
            } else {
                try {
                    params.put(key, parameters.getString(key));
                } catch (JSONException e) {
                    // Need to handle JSON parameters
                    Log.w(TAG, "Non-string parameter provided to dialog discarded");
                }
            }
        }

        if (method == null) {
            callbackContext.error("No method provided");
        } else if (method.equalsIgnoreCase("apprequests")) {

            if (!GameRequestDialog.canShow()) {
                callbackContext.error("Cannot show dialog");
                return;
            }
            showDialogContext = callbackContext;
            PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
            pr.setKeepCallback(true);
            showDialogContext.sendPluginResult(pr);

            GameRequestContent.Builder builder = new GameRequestContent.Builder();
            if (params.containsKey("message"))
                builder.setMessage(params.get("message"));
            if (params.containsKey("to"))
                builder.setTo(params.get("to"));
            if (params.containsKey("data"))
                builder.setData(params.get("data"));
            if (params.containsKey("title"))
                builder.setTitle(params.get("title"));
            if (params.containsKey("objectId"))
                builder.setObjectId(params.get("objectId"));
            if (params.containsKey("actionType")) {
                try {
                    final GameRequestContent.ActionType actionType = GameRequestContent.ActionType.valueOf(params.get("actionType"));
                    builder.setActionType(actionType);
                } catch (IllegalArgumentException e) {
                    Log.w(TAG, "Discarding invalid argument actionType");
                }
            }
            if (params.containsKey("filters")) {
                try {
                    final GameRequestContent.Filters filters = GameRequestContent.Filters.valueOf(params.get("filters"));
                    builder.setFilters(filters);
                } catch (IllegalArgumentException e) {
                    Log.w(TAG, "Discarding invalid argument filters");
                }
            }

            // Set up the activity result callback to this class
            cordova.setActivityResultCallback(this);

            gameRequestDialog.show(builder.build());

        } else if (method.equalsIgnoreCase("share") || method.equalsIgnoreCase("feed")) {
            if (!ShareDialog.canShow(ShareLinkContent.class)) {
                callbackContext.error("Cannot show dialog");
                return;
            }
            showDialogContext = callbackContext;
            PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
            pr.setKeepCallback(true);
            showDialogContext.sendPluginResult(pr);

            ShareLinkContent content = buildContent(params);
            // Set up the activity result callback to this class
            cordova.setActivityResultCallback(this);
            shareDialog.show(content);

        } else if (method.equalsIgnoreCase("share_open_graph")) {
            if (!ShareDialog.canShow(ShareOpenGraphContent.class)) {
                callbackContext.error("Cannot show dialog");
                return;
            }
            showDialogContext = callbackContext;
            PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
            pr.setKeepCallback(true);
            showDialogContext.sendPluginResult(pr);

            if (!params.containsKey("action")) {
                callbackContext.error("Missing required parameter 'action'");
            }

            if (!params.containsKey("object")) {
                callbackContext.error("Missing required parameter 'object'.");
            }

            ShareOpenGraphObject.Builder objectBuilder = new ShareOpenGraphObject.Builder();
            JSONObject jObject = new JSONObject(params.get("object"));

            Iterator<?> objectKeys = jObject.keys();

            String objectType = "";

            while ( objectKeys.hasNext() ) {
                String key = (String)objectKeys.next();
                String value = jObject.getString(key);

                objectBuilder.putString(key, value);

                if (key.equals("og:type"))
                    objectType = value;
            }

            if (objectType.equals("")) {
                callbackContext.error("Missing required object parameter 'og:type'");
            }

            ShareOpenGraphAction.Builder actionBuilder = new ShareOpenGraphAction.Builder();
            actionBuilder.setActionType(params.get("action"));

            if (params.containsKey("action_properties")) {
                JSONObject jActionProperties = new JSONObject(params.get("action_properties"));

                Iterator<?> actionKeys = jActionProperties.keys();

                while ( actionKeys.hasNext() ) {
                    String actionKey = (String)actionKeys.next();

                    actionBuilder.putString(actionKey, jActionProperties.getString(actionKey));
                }
            }

            actionBuilder.putObject(objectType, objectBuilder.build());

            ShareOpenGraphContent.Builder content = new ShareOpenGraphContent.Builder()
                    .setPreviewPropertyName(objectType)
                    .setAction(actionBuilder.build());

            shareDialog.show(content.build());

        } else if (method.equalsIgnoreCase("send")) {
            if (!MessageDialog.canShow(ShareLinkContent.class)) {
                callbackContext.error("Cannot show dialog");
                return;
            }
            showDialogContext = callbackContext;
            PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
            pr.setKeepCallback(true);
            showDialogContext.sendPluginResult(pr);

            ShareLinkContent.Builder builder = new ShareLinkContent.Builder();
            if(params.containsKey("link"))
                builder.setContentUrl(Uri.parse(params.get("link")));
            if(params.containsKey("caption"))
                builder.setContentTitle(params.get("caption"));
            if(params.containsKey("picture"))
                builder.setImageUrl(Uri.parse(params.get("picture")));
            if(params.containsKey("description"))
                builder.setContentDescription(params.get("description"));

            messageDialog.show(builder.build());

        } else {
            callbackContext.error("Unsupported dialog method.");
        }
    }

    private void executeGraph(JSONArray args, CallbackContext callbackContext) throws JSONException {
        graphContext = callbackContext;
        PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
        pr.setKeepCallback(true);
        graphContext.sendPluginResult(pr);

        graphPath = args.getString(0);
        JSONArray arr = args.getJSONArray(1);

        final Set<String> permissions = new HashSet<String>(arr.length());
        for (int i = 0; i < arr.length(); i++) {
            permissions.add(arr.getString(i));
        }

        if (permissions.size() == 0) {
            makeGraphCall();
            return;
        }

        boolean publishPermissions = false;
        boolean readPermissions = false;
        String declinedPermission = null;

        AccessToken accessToken = AccessToken.getCurrentAccessToken();
        if (accessToken.getPermissions().containsAll(permissions)) {
            makeGraphCall();
            return;
        }

        Set<String> declined = accessToken.getDeclinedPermissions();

        // Figure out if we have all permissions
        for (String permission : permissions) {
            if (declined.contains(permission)) {
                declinedPermission = permission;
                break;
            }

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

        if (declinedPermission != null) {
            graphContext.error("This request needs declined permission: " + declinedPermission);
        }

        if (publishPermissions && readPermissions) {
            graphContext.error("Cannot ask for both read and publish permissions.");
            return;
        }

        cordova.setActivityResultCallback(this);
        LoginManager loginManager = LoginManager.getInstance();
        // Check for write permissions, the default is read (empty)
        if (publishPermissions) {
            // Request new publish permissions
            loginManager.logInWithPublishPermissions(cordova.getActivity(), permissions);
        } else {
            // Request new read permissions
            loginManager.logInWithReadPermissions(cordova.getActivity(), permissions);
        }
    }

    private void executeLogEvent(JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (args.length() == 0) {
            // Not enough parameters
            callbackContext.error("Invalid arguments");
            return;
        }

        String eventName = args.getString(0);
        if (args.length() == 1) {
            logger.logEvent(eventName);
            callbackContext.success();
            return;
        }

        // Arguments is greater than 1
        JSONObject params = args.getJSONObject(1);
        Bundle parameters = new Bundle();
        Iterator<String> iter = params.keys();

        while (iter.hasNext()) {
            String key = iter.next();
            try {
                // Try get a String
                String value = params.getString(key);
                parameters.putString(key, value);
            } catch (JSONException e) {
                // Maybe it was an int
                Log.w(TAG, "Type in AppEvent parameters was not String for key: " + key);
                try {
                    int value = params.getInt(key);
                    parameters.putInt(key, value);
                } catch (JSONException e2) {
                    // Nope
                    Log.e(TAG, "Unsupported type in AppEvent parameters for key: " + key);
                }
            }
        }

        if (args.length() == 2) {
            logger.logEvent(eventName, parameters);
            callbackContext.success();
        }

        if (args.length() == 3) {
            double value = args.getDouble(2);
            logger.logEvent(eventName, value, parameters);
            callbackContext.success();
        }
    }

    private void executeLogin(JSONArray args, CallbackContext callbackContext) throws JSONException {
        Log.d(TAG, "login FB");
        // Get the permissions
        Set<String> permissions = new HashSet<String>(args.length());

        for (int i = 0; i < args.length(); i++) {
            permissions.add(args.getString(i));
        }

        // Set a pending callback to cordova
        loginContext = callbackContext;
        PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
        pr.setKeepCallback(true);
        loginContext.sendPluginResult(pr);

        // Check if the active session is open
        if (!hasAccessToken()) {
            // Set up the activity result callback to this class
            cordova.setActivityResultCallback(this);

            // Create the request
            LoginManager.getInstance().logInWithReadPermissions(cordova.getActivity(), permissions);
            return;
        }

        // Reauthorize flow
        boolean publishPermissions = false;
        boolean readPermissions = false;
        // Figure out if this will be a read or publish reauthorize
        if (permissions.size() == 0) {
            // No permissions, read
            readPermissions = true;
        }

        // Loop through the permissions to see what
        // is being requested
        for (String permission : permissions) {
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
            loginContext.error("Cannot ask for both read and publish permissions.");
            loginContext = null;
            return;
        }

        // Set up the activity result callback to this class
        cordova.setActivityResultCallback(this);
        // Check for write permissions, the default is read (empty)
        if (publishPermissions) {
            // Request new publish permissions
            LoginManager.getInstance().logInWithPublishPermissions(cordova.getActivity(), permissions);
        } else {
            // Request new read permissions
            LoginManager.getInstance().logInWithReadPermissions(cordova.getActivity(), permissions);
        }
    }

    private ShareLinkContent buildContent(Map<String, String> paramBundle) {
        ShareLinkContent.Builder builder = new ShareLinkContent.Builder();
        if (paramBundle.containsKey("href"))
            builder.setContentUrl(Uri.parse(paramBundle.get("href")));
        if (paramBundle.containsKey("caption"))
            builder.setContentTitle(paramBundle.get("caption"));
        if (paramBundle.containsKey("description"))
            builder.setContentDescription(paramBundle.get("description"));
        if (paramBundle.containsKey("link"))
            builder.setContentUrl(Uri.parse(paramBundle.get("link")));
        if (paramBundle.containsKey("picture"))
            builder.setImageUrl(Uri.parse(paramBundle.get("picture")));
        return builder.build();
    }

    // Simple active session check
    private boolean hasAccessToken() {
        return AccessToken.getCurrentAccessToken() != null;
    }

    private void handleError(FacebookException exception, CallbackContext context) {
        if (exception.getMessage() != null) {
            Log.e(TAG, exception.toString());
        }
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

        if (context != null) {
            context.error(getErrorResponse(exception, errMsg, errorCode));
        } else {
            Log.e(TAG, "Error already sent so no context, msg: " + errMsg + ", code: " + errorCode);
        }
    }

    private void makeGraphCall() {
        //If you're using the paging URLs they will be URLEncoded, let's decode them.
        try {
            graphPath = URLDecoder.decode(graphPath, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }

        String[] urlParts = graphPath.split("\\?");
        String graphAction = urlParts[0];
        GraphRequest graphRequest = GraphRequest.newGraphPathRequest(AccessToken.getCurrentAccessToken(), graphAction, new GraphRequest.Callback() {
            @Override
            public void onCompleted(GraphResponse response) {
                if (graphContext != null) {
                    if (response.getError() != null) {
                        graphContext.error(getFacebookRequestErrorResponse(response.getError()));
                    } else {
                        graphContext.success(response.getJSONObject());
                    }
                    graphPath = null;
                    graphContext = null;
                }
            }
        });

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

        graphRequest.setParameters(params);
        graphRequest.executeAsync();
    }

    /*
     * Checks for publish permissions
     */
    private boolean isPublishPermission(String permission) {
        return permission != null &&
                (permission.startsWith(PUBLISH_PERMISSION_PREFIX) ||
                permission.startsWith(MANAGE_PERMISSION_PREFIX) ||
                OTHER_PUBLISH_PERMISSIONS.contains(permission));
    }

    /**
     * Create a Facebook Response object that matches the one for the Javascript SDK
     * @return JSONObject - the response object
     */
    public JSONObject getResponse() {
        String response;
        final AccessToken accessToken = AccessToken.getCurrentAccessToken();
        if (hasAccessToken()) {
            Date today = new Date();
            long expiresTimeInterval = (accessToken.getExpires().getTime() - today.getTime()) / 1000L;
            response = "{"
                + "\"status\": \"connected\","
                + "\"authResponse\": {"
                + "\"accessToken\": \"" + accessToken.getToken() + "\","
                + "\"expiresIn\": \"" + Math.max(expiresTimeInterval, 0) + "\","
                + "\"session_key\": true,"
                + "\"sig\": \"...\","
                + "\"userID\": \"" + accessToken.getUserId() + "\""
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

        if (error.getErrorUserMessage() != null) {
            response += ",\"errorUserMessage\": \"" + error.getErrorUserMessage() + "\"";
        }

        if (error.getErrorUserTitle() != null) {
            response += ",\"errorUserTitle\": \"" + error.getErrorUserTitle() + "\"";
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

    /**
     * Wraps the given object if necessary.
     *
     * If the object is null or , returns {@link #JSONObject.NULL}.
     * If the object is a {@code JSONArray} or {@code JSONObject}, no wrapping is necessary.
     * If the object is {@code JSONObject.NULL}, no wrapping is necessary.
     * If the object is an array or {@code Collection}, returns an equivalent {@code JSONArray}.
     * If the object is a {@code Map}, returns an equivalent {@code JSONObject}.
     * If the object is a primitive wrapper type or {@code String}, returns the object.
     * Otherwise if the object is from a {@code java} package, returns the result of {@code toString}.
     * If wrapping fails, returns null.
     */
    private static Object wrapObject(Object o) {
        if (o == null) {
            return JSONObject.NULL;
        }
        if (o instanceof JSONArray || o instanceof JSONObject) {
            return o;
        }
        if (o.equals(JSONObject.NULL)) {
            return o;
        }
        try {
            if (o instanceof Collection) {
                return new JSONArray((Collection) o);
            } else if (o.getClass().isArray()) {
                return new JSONArray(o);
            }
            if (o instanceof Map) {
                return new JSONObject((Map) o);
            }
            if (o instanceof Boolean ||
                o instanceof Byte ||
                o instanceof Character ||
                o instanceof Double ||
                o instanceof Float ||
                o instanceof Integer ||
                o instanceof Long ||
                o instanceof Short ||
                o instanceof String) {
                return o;
            }
            if (o.getClass().getPackage().getName().startsWith("java.")) {
                return o.toString();
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
