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

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.facebook.AppEventsLogger;
import com.facebook.FacebookDialogException;
import com.facebook.FacebookException;
import com.facebook.FacebookOperationCanceledException;
import com.facebook.Request;
import com.facebook.Response;
import com.facebook.Session;
import com.facebook.SessionState;
import com.facebook.model.GraphObject;
import com.facebook.model.GraphUser;
import com.facebook.widget.WebDialog;
import com.facebook.widget.WebDialog.OnCompleteListener;

public class ConnectPlugin extends CordovaPlugin {

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

	@Override
	public void initialize(CordovaInterface cordova, CordovaWebView webView) {

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
		if (session != null && session.isOpened()) {
			// Call this method to initialize the session state info
			onSessionStateChange(session.getState(), null);
		}
		super.initialize(cordova, webView);
	}

	@Override
	public void onResume(boolean multitasking) {
		super.onResume(multitasking);
		// Developers can observe how frequently users activate their app by logging an app activation event. 
		AppEventsLogger.activateApp(cordova.getActivity());
	}

	@Override
	public void onActivityResult(int requestCode, int resultCode, Intent intent) {
		super.onActivityResult(requestCode, resultCode, intent);
		Log.d(TAG, "activity result in plugin");
		Session.getActiveSession().onActivityResult(cordova.getActivity(), requestCode, resultCode, intent);
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
			if (session != null && session.isOpened()) {
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
			if (session != null) {
				if (session.isOpened()) {
					session.closeAndClearTokenInformation();
					userID = null;
					callbackContext.success();
				} else {
					// Session not open
					callbackContext.error("Session not open.");
				}
			} else {
				callbackContext.error("No valid session found, must call init and login before logout.");
			}
			return true;
		} else if (action.equals("getLoginStatus")) {
			callbackContext.success(getResponse());
			return true;
		} else if (action.equals("getAccessToken")) {
			Session session = Session.getActiveSession();
			if (session != null) {
				if (session.isOpened()) {
					callbackContext.success(session.getAccessToken());
				} else {
					// Session not open
					callbackContext.error("Session not open.");
				}
			} else {
				callbackContext
					.error("No valid session found, must call init and login before logout.");
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
				// args is greater than 1
				JSONObject params = args.getJSONObject(1);
				Bundle parameters = new Bundle();

				Iterator<?> iterator = params.keys();
				while (iterator.hasNext() ) {
					try {
						// Try get a String
						String value = params.getString((String) iterator.next());
						parameters.putString((String) iterator.next(), value);
					} catch (Exception e) {
						// Maybe it was an int
						Log.w(TAG, "Type in AppEvent parameters was not String for key: " + (String) iterator.next());
						try {
							int value = params.getInt((String) iterator.next());
							parameters.putInt((String) iterator.next(), value);
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

			// Begin by sending a callback pending notice to Cordova
			showDialogContext = callbackContext;
			PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
			pr.setKeepCallback(true);
			showDialogContext.sendPluginResult(pr);

			// Setup callback context
			final OnCompleteListener dialogCallback = new OnCompleteListener() {

				@Override
				public void onComplete(Bundle values, FacebookException exception) {
					String errMsg;
					if (exception != null) {
						// User clicked "x"
						if (exception instanceof FacebookOperationCanceledException) {
							errMsg = "User cancelled dialog";
							Log.e(TAG, errMsg);
							showDialogContext.error(errMsg);
						} else if (exception instanceof FacebookDialogException) {
							// Dialog error
							errMsg = "Dialog error: " + exception.getMessage();
							Log.e(TAG, errMsg);
							showDialogContext.error(errMsg);
						} else {
							// Facebook error
							errMsg = "Facebook error: " + exception.getMessage();
							Log.e(TAG, errMsg);
							showDialogContext.error(errMsg);
						}
					} else {
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
									response.put(key, values.get(key));
								}
							} catch (JSONException e) {
								e.printStackTrace();
							}
							showDialogContext.success(response);
						} else {
							errMsg = "User cancelled dialog";
							Log.e(TAG, errMsg);
							showDialogContext.error(errMsg);
						}
					}
				}
			};

			if (this.method.equalsIgnoreCase("feed")) {
				Runnable runnable = new Runnable() {
					public void run() {
						WebDialog feedDialog = (new WebDialog.FeedDialogBuilder(me.cordova.getActivity(), Session.getActiveSession(), paramBundle)).setOnCompleteListener(dialogCallback).build();
						feedDialog.show();
					};

				};
				cordova.getActivity().runOnUiThread(runnable);
			} else if (this.method.equalsIgnoreCase("apprequests")) {
				Runnable runnable = new Runnable() {
					public void run() {
						WebDialog requestsDialog = (new WebDialog.RequestsDialogBuilder(me.cordova.getActivity(), Session.getActiveSession(), paramBundle)).setOnCompleteListener(dialogCallback)
								.build();
						requestsDialog.show();
					};
				};
				cordova.getActivity().runOnUiThread(runnable);
			} else if (this.method.equalsIgnoreCase("share") || this.method.equalsIgnoreCase("share_open_graph")) {
				cordova.getActivity().runOnUiThread(new WebDialogBuilderRunnable(me.cordova.getActivity(), Session.getActiveSession(), this.method, paramBundle, dialogCallback));
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

			final Session session = Session.getActiveSession();
			final ConnectPlugin me = this;

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
					if (session.getPermissions().containsAll(permissionsList)) {
						makeGraphCall();
					} else {
						// Set up the new permissions request
						Session.NewPermissionsRequest newPermissionsRequest = new Session.NewPermissionsRequest(cordova.getActivity(), permissionsList);
						// Set up the activity result callback to this class
						cordova.setActivityResultCallback(me);
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

	private void getUserInfo(final Session session) {
		if (cordova != null) {
			Request.newMeRequest(session, new Request.GraphUserCallback() {

				@Override
				public void onCompleted(GraphUser user, Response response) {
					// Create a new result with response data
					if (loginContext != null) {
						GraphObject graphObject = response.getGraphObject();
						Log.d(TAG, "returning login object " + graphObject.getInnerJSONObject().toString());
						userID = user.getId();
						loginContext.success(getResponse());
						loginContext = null;
					}
				}
			}).executeAsync();
		}
	}

	private void makeGraphCall() {
		Session session = Session.getActiveSession();

		Request.Callback graphCallback = new Request.Callback() {

			@Override
			public void onCompleted(Response response) {
				if (graphContext != null) {
					if (response.getError() != null) {
						graphContext.error(response.getError().getErrorMessage());
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
		final Session session = Session.getActiveSession();
		// Check if the session is open
		if (state.isOpened()) {
			if (loginContext != null) {
				// Get user info
				getUserInfo(session);
			} else if (graphContext != null) {
				// Make the graph call
				makeGraphCall();
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
    	Session session = Session.getActiveSession();
    	if (session != null && session.isOpened()) {
    		Date today = new Date();
    		long expiresTimeInterval = (session.getExpirationDate().getTime() - today.getTime()) / 1000L;
    		long expiresIn = (expiresTimeInterval > 0) ? expiresTimeInterval : 0;
    		response = "{"+
            "\"status\": \"connected\","+
            "\"authResponse\": {"+
              "\"accessToken\": \""+session.getAccessToken()+"\","+
              "\"expiresIn\": \""+expiresIn+"\","+
              "\"session_key\": true,"+
              "\"sig\": \"...\","+
              "\"userID\": \""+this.userID+"\""+
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
	
	private class WebDialogBuilderRunnable implements Runnable {
		private Context context;
		private Session session;
		private String method;
		private Bundle paramBundle;
		private OnCompleteListener dialogCallback;
		
		public WebDialogBuilderRunnable(Context context, Session session, String method, Bundle paramBundle, OnCompleteListener dialogCallback) {
			this.context = context;
			this.session = session;
			this.method = method;
			this.paramBundle = paramBundle;
			this.dialogCallback = dialogCallback;
		}

		public void run() {
			WebDialog shareDialog = (new WebDialog.Builder(context, session, method, paramBundle)).setOnCompleteListener(dialogCallback).build();
			shareDialog.show();
		}
	}
}
