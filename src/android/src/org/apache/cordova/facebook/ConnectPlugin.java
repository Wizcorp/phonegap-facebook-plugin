package org.apache.cordova.facebook;

import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
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
import com.facebook.model.GraphUser;
import com.facebook.widget.WebDialog;
import com.facebook.widget.WebDialog.OnCompleteListener;

public class ConnectPlugin extends Plugin {
	
	private static final String FEED_DIALOG = "feed";
	private static final String APPREQUESTS_DIALOG = "apprequests";
    private static final String PUBLISH_PERMISSION_PREFIX = "publish";
    private static final String MANAGE_PERMISSION_PREFIX = "manage";
    @SuppressWarnings("serial")
    private static final Set<String> OTHER_PUBLISH_PERMISSIONS = new HashSet<String>() {{
        add("ads_management");
        add("create_event");
        add("rsvp_event");
    }};
    
    public static final String SINGLE_SIGN_ON_DISABLED = "service_disabled";
    private final String TAG = "ConnectPlugin";

    private String loginCallbackId = "";
    private String dialogCallbackId = "";
    
    private String applicationId;
    
    private String userId;
    
    private Bundle paramBundle;
    private String method;

    @Override
    public PluginResult execute(String action, JSONArray args, final String callbackId) {
        PluginResult pr = new PluginResult(PluginResult.Status.NO_RESULT);
        pr.setKeepCallback(true);

        if (action.equals("init")) {
            try {
            	Log.d(TAG, "init: Initializing plugin.");
            	
            	// Get the Facebook App Id
            	applicationId = args.getString(0);
                
            	// Save the callback Id, in the case that the user's session
            	// is open and we can get user info
            	this.loginCallbackId = callbackId;
            	
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
                        public void call(Session session, 
                                         SessionState state,
                                         Exception exception) {
                    		onSessionStateChange(state, exception);
                    	}
                    });
                    session.openForRead(openRequest); 
            	}

                // If we have a valid open session, get user's info
                if (session != null && session.isOpened()) {
                	// Call this method to initialize the session state info
                	onSessionStateChange(session.getState(), null);
                } else {
                	return new PluginResult(PluginResult.Status.OK);
                }
            } catch (JSONException e) {              
                e.printStackTrace();
                return new PluginResult(PluginResult.Status.ERROR, "Invalid JSON args used. expected a string as the first arg.");
            }
        }

        else if (action.equals("login")) {
        	
        	// Save the callback Id, in the case that the user's session
        	// is open and we can get user info
        	this.loginCallbackId = callbackId;
        	
        	// Get the permissions
        	String[] arrayPermissions = new String[args.length()];
        	try {
                for (int i=0; i<args.length(); i++) {
                    arrayPermissions[i] = args.getString(i);
                }
            } catch (JSONException e1) {
               
                e1.printStackTrace();
                return new PluginResult(PluginResult.Status.ERROR, "Invalid JSON args used. Expected a string array of permissions.");
            }
        	List<String> permissions = null;
        	if (arrayPermissions.length > 0) {
        		permissions = Arrays.asList(arrayPermissions);
        	}
            
            // Get the currently active session
            Session session = Session.getActiveSession();
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
            		pr = new PluginResult(PluginResult.Status.ERROR, "Cannot ask for both read and publish permissions.");
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
                // Set up the activity result callback to this class
            	cordova.setActivityResultCallback(this);
                // Can only ask for read permissions initially
                session.openForRead(openRequest);              
        	}
        }

        else if (action.equals("logout")) {
        	
        	Session session = Session.getActiveSession();
        	if (session != null) {
        		if (session.isOpened()) {
        			session.closeAndClearTokenInformation();
        			userId = null;
        			pr = new PluginResult(PluginResult.Status.OK, getResponse());
        		} else {
        			// Session not open
        			pr = new PluginResult(PluginResult.Status.ERROR, "Session not open.");
        		}
        	} else {
        		pr = new PluginResult(PluginResult.Status.ERROR, "No valid session found, must call init and login before logout.");
        	}
        }

        else if (action.equals("getLoginStatus")) {
        	pr = new PluginResult(PluginResult.Status.OK, getResponse());
        }
        
        else if (action.equals("showDialog")) {
        	
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
    		this.dialogCallbackId = callbackId;
    		
    		if (this.method.equals(FEED_DIALOG)) {
    			Runnable runnable = new Runnable() {
        			public void run() {
        				WebDialog feedDialog = (new WebDialog.FeedDialogBuilder(
        						me.cordova.getActivity(),
        						Session.getActiveSession(),
        						paramBundle))
        						.setOnCompleteListener(new UIDialogListener(me))
        						.build();
        				feedDialog.show();
        			};
    			};
    			cordova.getActivity().runOnUiThread(runnable);
    		} else if (this.method.equals(APPREQUESTS_DIALOG)) {
    			Runnable runnable = new Runnable() {
        			public void run() {
        				WebDialog requestsDialog = (new WebDialog.RequestsDialogBuilder(
        						me.cordova.getActivity(),
        						Session.getActiveSession(),
        						paramBundle))
        						.setOnCompleteListener(new UIDialogListener(me))
        						.build();
        				requestsDialog.show();
        			};
    			};
    			cordova.getActivity().runOnUiThread(runnable);
    		} else {
    			pr = new PluginResult(PluginResult.Status.ERROR, "Unsupported dialog method.");
    		}
        }

        return pr;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        Session session = Session.getActiveSession();
        // Update the session-based info, ex: permissions
        if (session != null) {
        	session.onActivityResult(cordova.getActivity(), requestCode, resultCode, data);
        }
    }

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
    
    private void getUserInfo(final Session session) {
    	final ConnectPlugin me = this;
    	Runnable runnable = new Runnable() {
			public void run() {
				Request request = Request.newMeRequest(session, new RequestUserCallback(me));
				Request.executeBatchAsync(request);
			};
		};
		cordova.getActivity().runOnUiThread(runnable);
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
    
    class UIDialogListener implements OnCompleteListener {
   	 final ConnectPlugin fba;

		public UIDialogListener(ConnectPlugin fba){
			super();
			this.fba = fba;
		}

		@Override
		public void onComplete(Bundle values,
				FacebookException exception) {
			if (exception != null) {
				// User clicked "x"
				if (exception instanceof FacebookOperationCanceledException) {
					Log.d(TAG, "cancel");
			           this.fba.success(new PluginResult(PluginResult.Status.NO_RESULT), 
			        		   this.fba.dialogCallbackId);
				}
				// Dialog error
				else if (exception instanceof FacebookDialogException) {
					Log.d(TAG, "other error");
			           this.fba.error("Dialog error: " + exception.getMessage(), 
			        		   this.fba.dialogCallbackId);
				}
				// Facebook error
				else {
					Log.d(TAG, "facebook error");
			           this.fba.error("Facebook error: " + exception.getMessage(), 
			        		   this.fba.dialogCallbackId);
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
					this.fba.success(new PluginResult(PluginResult.Status.OK, response), 
							this.fba.dialogCallbackId);
				} else {
					this.fba.success(new PluginResult(PluginResult.Status.OK), 
							this.fba.dialogCallbackId);
				}
			}
		}
	}
    
    class RequestUserCallback implements Request.GraphUserCallback {
    	final ConnectPlugin fba;
    	
    	public RequestUserCallback(ConnectPlugin fba){
			super();
			this.fba = fba;
		}
    	
    	@Override
        public void onCompleted(GraphUser user, Response response) {
    		if (user != null) {
            	// Set the user id (for the response)
            	this.fba.userId = user.getId();
            }
            // Create a new result with response data
        	PluginResult result = new PluginResult(PluginResult.Status.OK,
        			this.fba.getResponse());
        	result.setKeepCallback(false);
        	this.fba.success(result,this.fba.loginCallbackId);
        }
    }
    
}
