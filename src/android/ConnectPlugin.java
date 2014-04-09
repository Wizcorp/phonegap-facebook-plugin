package org.apache.cordova.facebook;

import java.util.Arrays;
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
	private static final Set<String> OTHER_PUBLISH_PERMISSIONS = new HashSet<String>() {{
        add("ads_management");
        add("create_event");
        add("rsvp_event");
    }};
    private final String TAG = "ConnectPlugin";

    private String applicationId = null;
    private CallbackContext loginContext = null;
    private CallbackContext showDialogContext = null;
    private Bundle paramBundle;
    private String method;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    	
    	int appResId = cordova.getActivity().getResources().getIdentifier("fb_app_id", "string", cordova.getActivity().getPackageName());
    	applicationId = cordova.getActivity().getString(appResId);
    	
        // Set up the activity result callback to this class
    	cordova.setActivityResultCallback(this);
    	
    	// Open a session if we have one cached
		Session session = new Session.Builder(cordova.getActivity())
			.setApplicationId(applicationId)
			.build();
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
			for (int i=0; i<args.length(); i++) {
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
                	Session.NewPermissionsRequest newPermissionsRequest =  new Session.NewPermissionsRequest(cordova.getActivity(), 
                			permissions);
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
        		session = new Session.Builder(cordova.getActivity())
        		.setApplicationId(applicationId)
        		.build();
        		Session.setActiveSession(session);
                // - Create the request
                Session.OpenRequest openRequest = new Session.OpenRequest(cordova.getActivity());
                // - Set the permissions
                openRequest.setPermissions(permissions);
                // - Set the status change call back
                openRequest.setCallback(new Session.StatusCallback() {
                	@Override
                    public void call(Session session, 
                                     SessionState state,
                                     Exception exception) {
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
					callbackContext.success();
				} else {
					// Session not open
					callbackContext.error("Session not open.");
				}
			} else {
				callbackContext
						.error("No valid session found, must call init and login before logout.");
			}
			return true;
        } else if (action.equals("getLoginStatus")) {
        	callbackContext.success(Session.getActiveSession().getState().toString());
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
            this.paramBundle =  new Bundle(collect);

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
        				WebDialog feedDialog = (new WebDialog.FeedDialogBuilder(
        						me.cordova.getActivity(),
        						Session.getActiveSession(),
        						paramBundle))
								.setOnCompleteListener(dialogCallback)
        						.build();
        				feedDialog.show();
        			};
        			
    			};
    			cordova.getActivity().runOnUiThread(runnable);
    		} else if (this.method.equalsIgnoreCase("apprequests")) {
    			Runnable runnable = new Runnable() {
        			public void run() {
        				WebDialog requestsDialog = (new WebDialog.RequestsDialogBuilder(
        						me.cordova.getActivity(),
        						Session.getActiveSession(),
        						paramBundle))
        						.setOnCompleteListener(dialogCallback)
        						.build();
        				requestsDialog.show();
        			};
    			};
    			cordova.getActivity().runOnUiThread(runnable);
    		} else {
    			callbackContext.error("Unsupported dialog method.");
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
	    				loginContext.success(graphObject.getInnerJSONObject());
	    				loginContext = null;
	    			}
	    		}
	    	}).executeAsync();
	    }
    }
    
    /*
     * Handles session state changes
     */
    private void onSessionStateChange(SessionState state, Exception exception) {
    	final Session session = Session.getActiveSession();
    	// Check if the session is open
    	if (state.isOpened()) {
    		// Get user info
    		getUserInfo(session);
    	}
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
}
