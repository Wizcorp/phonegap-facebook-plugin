//
//  FacebookWrapperSingleton
//  GapFacebookConnect
//
//  Created by Rafael Almeida - AppGyver.com
//
// AppGyver: *** The FacebookConnectPlugin class was modified to use the FacebookWrapperSingleton which is reused across multiple webviews ***
//

#import "FacebookWrapperSingleton.h"

static FacebookWrapperSingleton *instance;

@interface FacebookWrapperSingleton ()

@property (strong, nonatomic) NSString* userid;

@end

@implementation FacebookWrapperSingleton

+(FacebookWrapperSingleton*) instance {
    if ( instance == nil )
        instance = [FacebookWrapperSingleton new];
    
    return instance;
}

- (id) init {
    NSLog(@"Init FacebookConnect Session");
    
    self = [super init];
    
    if(self){
        self.userid = @"";
        [self setupFBSession];
    }
    return self;
}

-(void) setupFBSession {

    __weak typeof (self) weakSelf = self;
    
    [FBSession openActiveSessionWithReadPermissions:nil
                                       allowLoginUI:NO
                                  completionHandler:^(FBSession *session,
                                                      FBSessionState state,
                                                      NSError *error) {
                                      
                                      __strong typeof (self) strongSelf = weakSelf;
                                      
                                      NSLog(@"Facebook Session Requested from Cache -> State: %lu", (unsigned long)state);
                                      
                                      [strongSelf sessionStateChanged:session
                                                          state:state
                                                          error:error];
                                  }];
    
    // Add notification listener for tracking app activity with FB Events
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationDidBecomeActive)
                                                 name:UIApplicationDidBecomeActiveNotification object:nil];
    
    // Add notification listener for handleOpenURL
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(openURL:)
                                                 name:CDVPluginHandleOpenURLNotification object:nil];
}

- (void)openURL:(NSNotification *)notification {
    NSURL *url = [notification object];

    if (![url isKindOfClass:[NSURL class]]) {
        return;
    }

    [FBSession.activeSession handleOpenURL:url];
}

- (void)applicationDidBecomeActive {
    // Call the 'activateApp' method to log an app event for use in analytics and advertising reporting.
    [FBAppEvents activateApp];
}

-(void)notifySessionStateOpen {
    NSNotification* notification = [NSNotification
                                    notificationWithName:@"FB_PLUGIN_SESSION_STATE_OPEN"
                                    object:self
                                    userInfo:[self getStatusDictionary]];
    
    [[NSNotificationCenter defaultCenter] postNotification:notification];
}

-(void) notifySessionStateError:(NSString*)errorMessage {
    NSNotification* notification = [NSNotification
                                    notificationWithName:@"FB_PLUGIN_SESSION_STATE_ERROR"
                                    object:self
                                    userInfo:@{@"errorMessage":errorMessage}];
    
    [[NSNotificationCenter defaultCenter] postNotification:notification];
}

/*
 * Callback for session changes.
 */
- (void)sessionStateChanged:(FBSession *)session
                      state:(FBSessionState) state
                      error:(NSError *)error
{
    __weak typeof (self) weakSelf = self;
    
    switch (state) {
        case FBSessionStateOpen:
            if (!error) {
                
            }
        case FBSessionStateOpenTokenExtended:
            if (!error) {
                // We have a valid session
                
                if (state == FBSessionStateOpen) {
                    // Get the user's info
                    [FBRequestConnection startForMeWithCompletionHandler:
                     ^(FBRequestConnection *connection, id <FBGraphUser>user, NSError *error) {
                         
                         __strong typeof (self) strongSelf = weakSelf;
                         
                         if (!error) {
                             strongSelf.userid = [user objectForKey:@"id"];
                             
                             [strongSelf notifySessionStateOpen];
                         } else {
                             strongSelf.userid = @"";
                         }
                     }];
                } else {
                    // Don't get user's info but trigger success callback
                    // Send the plugin result. Wait for a successful fetch of user info.
                    
                    [self notifySessionStateOpen];
                    
                }
            }
            break;
        case FBSessionStateClosed:
        case FBSessionStateClosedLoginFailed:
            [FBSession.activeSession closeAndClearTokenInformation];
            self.userid = @"";
            break;
        default:
            break;
    }
    
    if (error) {
        NSString *alertMessage = nil;
        
        if (error.fberrorShouldNotifyUser) {
            // If the SDK has a message for the user, surface it.
            alertMessage = error.fberrorUserMessage;
        } else if (error.fberrorCategory == FBErrorCategoryAuthenticationReopenSession) {
            // Handles session closures that can happen outside of the app.
            // Here, the error is inspected to see if it is due to the app
            // being uninstalled. If so, this is surfaced. Otherwise, a
            // generic session error message is displayed.
            NSInteger underlyingSubCode = [[error userInfo]
                                           [@"com.facebook.sdk:ParsedJSONResponseKey"]
                                           [@"body"]
                                           [@"error"]
                                           [@"error_subcode"] integerValue];
            if (underlyingSubCode == 458) {
                alertMessage = @"The app was removed. Please log in again.";
            } else {
                alertMessage = @"Your current session is no longer valid. Please log in again.";
            }
        } else if (error.fberrorCategory == FBErrorCategoryUserCancelled) {
            // The user has cancelled a login. You can inspect the error
            // for more context. In the plugin, we will simply ignore it.
            alertMessage = @"Permission denied.";
        } else {
            // For simplicity, this sample treats other errors blindly.
            alertMessage = [error localizedDescription];
        }
        
        if (alertMessage){
            [self notifySessionStateError:alertMessage];
        }
    }
}

-(BOOL) isSessionOpen {
    return FBSession.activeSession.isOpen;
}

-(void)requestNewPublishPermissions:(NSArray*)permissions defaultAudience:(FBSessionDefaultAudience)defaultAudience {
    
    __weak typeof (self) weakSelf = self;
    
    [FBSession.activeSession
        requestNewPublishPermissions:permissions
        defaultAudience:defaultAudience
        completionHandler:^(FBSession *session, NSError *error) {
            
            __strong typeof (self) strongSelf = weakSelf;
            
            [strongSelf sessionStateChanged:session
                             state:session.state
                             error:error];
        }];
}

-(void)requestNewReadPermissions:(NSArray*)permissions {

    __weak typeof (self) weakSelf = self;
    
    [self requestNewReadPermissions:permissions
     withBlock:^(FBSession *session, NSError *error) {
         __strong typeof (self) strongSelf = weakSelf;
         [strongSelf sessionStateChanged:session
                             state:session.state
                             error:error];
     }];
}

-(void)requestNewReadPermissions:(NSArray*)permissions withBlock:(FBSessionRequestPermissionResultHandler)handler{
    
    __weak typeof (self) weakSelf = self;
    
    [FBSession.activeSession
     requestNewReadPermissions:permissions
     completionHandler:^(FBSession *session, NSError *error) {
         __strong typeof (self) strongSelf = weakSelf;
         
         
         [strongSelf sessionStateChanged:session
                             state:session.state
                             error:error];
         
         if(handler){
             handler(session, error);
         }
         
     }];
}

-(void)openActiveSessionWithReadPermissions:(NSArray*)permissions allowLoginUI:(BOOL)allowLoginUI {
    
    __weak typeof (self) weakSelf = self;
    
    [FBSession
     openActiveSessionWithReadPermissions:permissions
     allowLoginUI:allowLoginUI
     completionHandler:^(FBSession *session,
                         FBSessionState state,
                         NSError *error) {
         __strong typeof (self) strongSelf = weakSelf;
         [strongSelf sessionStateChanged:session
                             state:state
                             error:error];
     }];
}

-(void) logout {
    if (FBSession.activeSession.isOpen) {
        // Close the session and clear the cache
        [FBSession.activeSession closeAndClearTokenInformation];
    }
}

- (NSDictionary *)getStatusDictionary {
    NSString *status = @"unknown";
    NSDictionary *sessionDict = nil;
    
    NSTimeInterval expiresTimeInterval = [FBSession.activeSession.accessTokenData.expirationDate timeIntervalSinceNow];
    NSString *expiresIn = @"0";
    if (expiresTimeInterval > 0) {
        expiresIn = [NSString stringWithFormat:@"%0.0f", expiresTimeInterval];
    }
    
    if (FBSession.activeSession.isOpen) {
        
        status = @"connected";
        sessionDict = @{
                        @"accessToken" : FBSession.activeSession.accessTokenData.accessToken,
                        @"expiresIn" : expiresIn,
                        @"secret" : @"...",
                        @"session_key" : [NSNumber numberWithBool:YES],
                        @"sig" : @"...",
                        @"userID" : self.userid
                        };
    }
    
    NSMutableDictionary *statusDict = [NSMutableDictionary dictionaryWithObject:status forKey:@"status"];
    if (nil != sessionDict) {
        [statusDict setObject:sessionDict forKey:@"authResponse"];
    }
        
    return statusDict;
}

@end
