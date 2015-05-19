//
//  FacebookConnectPlugin.m
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Updated by Mathijs de Bruin on 11-08-25.
//  Updated by Christine Abernathy on 13-01-22
//  Copyright 2011 Nitobi, Mathijs de Bruin. All rights reserved.
//

#import "FacebookConnectPlugin.h"

@interface FacebookConnectPlugin ()

@property (strong, nonatomic) NSString *userid;
@property (strong, nonatomic) NSString* loginCallbackId;
@property (strong, nonatomic) NSString* dialogCallbackId;
@property (strong, nonatomic) NSString* graphCallbackId;

@end

@implementation FacebookConnectPlugin


- (CDVPlugin *)initWithWebView:(UIWebView *)theWebView {
    NSLog(@"Init FacebookConnect Session");
    self = (FacebookConnectPlugin *)[super initWithWebView:theWebView];
    self.userid = @"";
    
    [FBSession openActiveSessionWithReadPermissions:nil
                                       allowLoginUI:NO
                                  completionHandler:^(FBSession *session,
                                                      FBSessionState state,
                                                      NSError *error) {
                                      [self sessionStateChanged:session
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
    return self;
}

- (void)openURL:(NSNotification *)notification {
    // NSLog(@"handle url: %@", [notification object]);
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

/*
 * Callback for session changes.
 */
- (void)sessionStateChanged:(FBSession *)session
                      state:(FBSessionState) state
                      error:(NSError *)error
{
    switch (state) {
        case FBSessionStateOpen:
        case FBSessionStateOpenTokenExtended:
            if (!error) {
                // We have a valid session
                
                if (state == FBSessionStateOpen) {
                    // Get the user's info
                    [FBRequestConnection startForMeWithCompletionHandler:
                     ^(FBRequestConnection *connection, id <FBGraphUser>user, NSError *error) {
                         if (!error) {
                             self.userid = [user objectForKey:@"id"];
                             
                             // Send the plugin result. Wait for a successful fetch of user info.
                             if (self.loginCallbackId) {
                                CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                                           messageAsDictionary:[self responseObject]];
                                [self.commandDelegate sendPluginResult:pluginResult callbackId:self.loginCallbackId];
                             }
                         } else {
                             self.userid = @"";
                         }
                     }];
                } else {
                    // Don't get user's info but trigger success callback
                    // Send the plugin result. Wait for a successful fetch of user info.
                    if (self.loginCallbackId) {
                        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK 
                                                                messageAsDictionary:[self responseObject]];
                        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.loginCallbackId];
                    }
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
            alertMessage = @"Error. Please try again later.";
        }
        
        if (alertMessage && self.loginCallbackId) {
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                              messageAsString:alertMessage];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.loginCallbackId];
        }
    }
}

/*
 * Check if a permision is a read permission.
 */
- (BOOL)isPublishPermission:(NSString*)permission {
    return [permission hasPrefix:@"publish"] ||
    [permission hasPrefix:@"manage"] ||
    [permission isEqualToString:@"ads_management"] ||
    [permission isEqualToString:@"create_event"] ||
    [permission isEqualToString:@"rsvp_event"];
}

/*
 * Check if all permissions are read permissions.
 */
- (BOOL)areAllPermissionsReadPermissions:(NSArray*)permissions {
    for (NSString *permission in permissions) {
        if ([self isPublishPermission:permission]) {
            return NO;
        }
    }
    return YES;
}

- (void)getLoginStatus:(CDVInvokedUrlCommand *)command {
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                  messageAsDictionary:[self responseObject]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getAccessToken:(CDVInvokedUrlCommand *)command {
    // Return access token if available
    CDVPluginResult *pluginResult;
    // Check if the session is open or not
    if (FBSession.activeSession.isOpen) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:
                        FBSession.activeSession.accessTokenData.accessToken];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:
                        @"Session not open."];
    }
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)logEvent:(CDVInvokedUrlCommand *)command {
    if ([command.arguments count] == 0) {
        // Not enough arguments
        CDVPluginResult *res = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Invalid arguments"];
        [self.commandDelegate sendPluginResult:res callbackId:command.callbackId];
        return;
    }
    [self.commandDelegate runInBackground:^{
        // For more verbose output on logging uncomment the following:
        // [FBSettings setLoggingBehavior:[NSSet setWithObject:FBLoggingBehaviorAppEvents]];
        NSString *eventName = [command.arguments objectAtIndex:0];
        CDVPluginResult *res;
        NSDictionary *params;
        double value;

        if ([command.arguments count] == 1) {
            [FBAppEvents logEvent:eventName];
        } else {
            // argument count is not 0 or 1, must be 2 or more
            params = [command.arguments objectAtIndex:1];
            if ([command.arguments count] == 2) {
                // If count is 2 we will just send params
                [FBAppEvents logEvent:eventName parameters:params];
            }
            if ([command.arguments count] == 3) {
                // If count is 3 we will send params and a value to sum
                value = [[command.arguments objectAtIndex:2] doubleValue];
                [FBAppEvents logEvent:eventName valueToSum:value parameters:params];
            }
        }
        res = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:res callbackId:command.callbackId];
    }];
}

- (void)logPurchase:(CDVInvokedUrlCommand *)command {
    /*
     While calls to logEvent can be made to register purchase events,
     there is a helper method that explicitly takes a currency indicator.
     */
    CDVPluginResult *res;
    if (!command.arguments == 2) {
        res = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Invalid arguments"];
        [self.commandDelegate sendPluginResult:res callbackId:command.callbackId];
        return;
    }
    double value = [[command.arguments objectAtIndex:0] doubleValue];
    NSString *currency = [command.arguments objectAtIndex:1];
    [FBAppEvents logPurchase:value currency:currency];

    res = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:res callbackId:command.callbackId];
}

- (void)login:(CDVInvokedUrlCommand *)command {
    BOOL permissionsAllowed = YES;
    NSString *permissionsErrorMessage = @"";
    NSArray *permissions = nil;
    CDVPluginResult *pluginResult;
    if ([command.arguments count] > 0) {
        permissions = command.arguments;
    }
    if (permissions == nil) {
        // We need permissions
        permissionsErrorMessage = @"No permissions specified at login";
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                         messageAsString:permissionsErrorMessage];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
    }
    
    // save the callbackId for the login callback
    self.loginCallbackId = command.callbackId;
    
    // Check if the session is open or not
    if (FBSession.activeSession.isOpen) {
        // Reauthorize if the session is already open.
        // In this instance we can ask for publish type
        // or read type only if taking advantage of iOS6.
        // To mix both, we'll use deprecated methods
        BOOL publishPermissionFound = NO;
        BOOL readPermissionFound = NO;
        
        for (NSString *p in permissions) {
            if ([self isPublishPermission:p]) {
                publishPermissionFound = YES;
            } else {
                readPermissionFound = YES;
            }
            
            // If we've found one of each we can stop looking.
            if (publishPermissionFound && readPermissionFound) {
                break;
            }
        }
        
        if (publishPermissionFound && readPermissionFound) {
            // Mix of permissions, not allowed
            permissionsAllowed = NO;
            permissionsErrorMessage = @"Your app can't ask for both read and write permissions.";
        } else if (publishPermissionFound) {
            // Only publish permissions
            [FBSession.activeSession
             requestNewPublishPermissions:permissions
             defaultAudience:FBSessionDefaultAudienceFriends
             completionHandler:^(FBSession *session, NSError *error) {
                [self sessionStateChanged:session
                                    state:session.state
                                    error:error];
             }];
        } else {
            // Only read permissions
            [FBSession.activeSession
             requestNewReadPermissions:permissions
             completionHandler:^(FBSession *session, NSError *error) {
                 [self sessionStateChanged:session
                                     state:session.state
                                     error:error];
             }];
        }
    } else {
        // Initial log in, can only ask to read
        // type permissions
        if ([self areAllPermissionsReadPermissions:permissions]) {
            [FBSession
             openActiveSessionWithReadPermissions:permissions
             allowLoginUI:YES
             completionHandler:^(FBSession *session,
                                 FBSessionState state,
                                 NSError *error) {
                 [self sessionStateChanged:session
                                     state:state
                                     error:error];
             }];
        } else {
            permissionsAllowed = NO;
            permissionsErrorMessage = @"You can only ask for read permissions initially";
        }
    }
    
    if (!permissionsAllowed) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                         messageAsString:permissionsErrorMessage];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.loginCallbackId];
    }
}

- (void) logout:(CDVInvokedUrlCommand*)command
{
    if (FBSession.activeSession.isOpen) {
        // Close the session and clear the cache
        [FBSession.activeSession closeAndClearTokenInformation];
    }
    // Else just return OK we are already logged out
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) showDialog:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult *pluginResult;
    // Save the callback ID
    self.dialogCallbackId = command.callbackId;
    
    NSMutableDictionary *options = [[command.arguments lastObject] mutableCopy];
    NSString* method = [[NSString alloc] initWithString:[options objectForKey:@"method"]];
    if ([options objectForKey:@"method"]) {
        [options removeObjectForKey:@"method"];
    }
    __block BOOL paramsOK = YES;
    NSMutableDictionary *params = [[NSMutableDictionary alloc] init];
    [options enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
        if ([obj isKindOfClass:[NSString class]]) {
            params[key] = obj;
        } else {
            NSError *error;
            NSData *jsonData = [NSJSONSerialization
                                dataWithJSONObject:obj
                                options:0
                                error:&error];
            if (!jsonData) {
                paramsOK = NO;
                // Error
                *stop = YES;
            }
            params[key] = [[NSString alloc]
                           initWithData:jsonData
                           encoding:NSUTF8StringEncoding];
        }
    }];
    
    if (!paramsOK) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                         messageAsString:@"Error completing dialog."];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.dialogCallbackId];
    } else {
        // Check method
        if ([method isEqualToString:@"send"]) {
            // Send private message dialog
            // Create native params
            FBLinkShareParams *fbparams = [[FBLinkShareParams alloc] init];
            fbparams.link = [NSURL URLWithString:[params objectForKey:@"link"]];
            fbparams.name = [params objectForKey:@"name"];
            fbparams.caption = [params objectForKey:@"caption"];
            fbparams.picture = [NSURL URLWithString:[params objectForKey:@"picture"]];
            fbparams.linkDescription = [params objectForKey:@"description"];
            // Do we have the messaging app installed?
            if ([FBDialogs canPresentMessageDialogWithParams:fbparams]) {
                // We cannot use the Web Dialog Builder API, must use FBDialog for messaging
                // Present message dialog
                [FBDialogs presentMessageDialogWithLink:[NSURL URLWithString:[params objectForKey:@"link"]]
                                                handler:^(FBAppCall *call, NSDictionary *results, NSError *error) {
                                                    CDVPluginResult *pluginResult = nil;
                                                    if (error) {
                                                        // An error occurred, we need to handle the error
                                                        // See: https://developers.facebook.com/docs/ios/errors
                                                        NSLog(@"Error messaging link: %@", error.localizedDescription);
                                                        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Error messaging link."];
                                                    } else {
                                                        // Success
                                                        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
                                                    }
                                                }];
            } else {
                // Do not have the messaging application installed
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Messaging unavailable."];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:self.dialogCallbackId];
            }
            return;
        } else if ([method isEqualToString:@"share"] || [method isEqualToString:@"share_open_graph"]) {
            // Create native params
            FBLinkShareParams *fbparams = [[FBLinkShareParams alloc] init];
            fbparams.link = [NSURL URLWithString:[params objectForKey:@"href"]];
            fbparams.name = [params objectForKey:@"name"];
            fbparams.caption = [params objectForKey:@"caption"];
            fbparams.picture = [NSURL URLWithString:[params objectForKey:@"picture"]];
            fbparams.linkDescription = [params objectForKey:@"description"];

            // If the Facebook app is installed and we can present the share dialog
            if ([FBDialogs canPresentShareDialogWithParams:fbparams]) {
                // Present the share dialog
                [FBDialogs presentShareDialogWithLink:fbparams.link
                                              handler:^(FBAppCall *call, NSDictionary *results, NSError *error) {
                                                  CDVPluginResult *pluginResult = nil;
                                                  if ([[results objectForKey:@"completionGesture"] isEqualToString:@"cancel"]) {
                                                      // User cancelled
                                                      pluginResult = [CDVPluginResult resultWithStatus:
                                                                      CDVCommandStatus_ERROR messageAsString:@"User cancelled."];
                                                  } else {
                                                      if (error) {
                                                          // An error occurred, we need to handle the error
                                                          // See: https://developers.facebook.com/docs/ios/errors
                                                          pluginResult = [CDVPluginResult resultWithStatus:
                                                                    CDVCommandStatus_ERROR messageAsString:[NSString stringWithFormat:@"Error: %@", error.description]];
                                                      } else {
                                                          // Success
                                                          pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
                                                      }
                                                  }
                                                  [self.commandDelegate sendPluginResult:pluginResult callbackId:self.dialogCallbackId];
                                              }];
                return;
            } // Else we run through into the WebDialog
        }
        // Show the web dialog
        [FBWebDialogs
         presentDialogModallyWithSession:FBSession.activeSession
         dialog:method parameters:params
         handler:^(FBWebDialogResult result, NSURL *resultURL, NSError *error) {
             CDVPluginResult* pluginResult = nil;
             if (error) {
                 // Dialog failed with error
                 pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                  messageAsString:@"Error completing dialog."];
             } else {
                 if (result == FBWebDialogResultDialogNotCompleted) {
                     // User clicked the "x" icon to Cancel
                     pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                      messageAsString:@"User cancelled."];
                 } else {
                     // Send the URL parameters back, for a requests dialog, the "request" parameter
                     // will include the resluting request id. For a feed dialog, the "post_id"
                     // parameter will include the resulting post id.
                     NSDictionary *params = [self parseURLParams:[resultURL query]];
                     pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:params];
                 }
             }
             [self.commandDelegate sendPluginResult:pluginResult callbackId:self.dialogCallbackId];
         }];
    }
    
    // For optional ARC support
    #if __has_feature(objc_arc)
    #else
        [method release];
        [params release];
        [options release];
    #endif
}

- (void) graphApi:(CDVInvokedUrlCommand *)command
{
    // Save the callback ID
    self.graphCallbackId = command.callbackId;
    
    NSString *graphPath = [command argumentAtIndex:0];
    NSArray *permissionsNeeded = [command argumentAtIndex:1];
    
    // We will store here the missing permissions that we will have to request
    NSMutableArray *requestPermissions = [[NSMutableArray alloc] initWithArray:@[]];
    
    // Check if all the permissions we need are present in the user's current permissions
    // If they are not present add them to the permissions to be requested
    for (NSString *permission in permissionsNeeded){
        if (![[[FBSession activeSession] permissions] containsObject:permission]) {
            [requestPermissions addObject:permission];
        }
    }
    
    // If we have permissions to request
    if ([requestPermissions count] > 0){
        // Ask for the missing permissions
        [FBSession.activeSession
         requestNewReadPermissions:requestPermissions
         completionHandler:^(FBSession *session, NSError *error) {
             if (!error) {
                 // Permission granted
                 NSLog(@"new permissions %@", [FBSession.activeSession permissions]);
                 // We can request the user information
                 [self makeGraphCall:graphPath];
             } else {
                 // An error occurred, we need to handle the error
                 // See: https://developers.facebook.com/docs/ios/errors
             }
         }];
    } else {
        // Permissions are present
        // We can request the user information
        [self makeGraphCall:graphPath];
    }
}

- (void) makeGraphCall:(NSString *)graphPath
{
    
    NSLog(@"Graph Path = %@", graphPath);
    [FBRequestConnection
     startWithGraphPath: graphPath
     completionHandler:^(FBRequestConnection *connection, id result, NSError *error) {
         CDVPluginResult* pluginResult = nil;
         if (!error) {
             NSDictionary *response = (NSDictionary *) result;
             
             pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:response];
         } else {
             pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                              messageAsString:[error localizedDescription]];
         }
         [self.commandDelegate sendPluginResult:pluginResult callbackId:self.graphCallbackId];
     }];
}

- (NSDictionary *)responseObject {
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

/**
 * A method for parsing URL parameters.
 */
- (NSDictionary*)parseURLParams:(NSString *)query {
    NSString *regexStr = @"^(.+)\\[(.*)\\]$";
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:regexStr options:0 error:nil];

    NSArray *pairs = [query componentsSeparatedByString:@"&"];
    NSMutableDictionary *params = [[NSMutableDictionary alloc] init];
    [pairs enumerateObjectsUsingBlock:
     ^(NSString *pair, NSUInteger idx, BOOL *stop) {
         NSArray *kv = [pair componentsSeparatedByString:@"="];
         NSString *key = [kv[0] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
         NSString *val = [kv[1] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];

         NSArray *matches = [regex matchesInString:key options:0 range:NSMakeRange(0, [key length])];
         if ([matches count] > 0) {
             for (NSTextCheckingResult *match in matches) {

                 NSString *newKey = [key substringWithRange:[match rangeAtIndex:1]];

                 if ([[params allKeys] containsObject:newKey]) {
                     NSMutableArray *obj = [params objectForKey:newKey];
                     [obj addObject:val];
                     [params setObject:obj forKey:newKey];
                 } else {
                     NSMutableArray *obj = [NSMutableArray arrayWithObject:val];
                     [params setObject:obj forKey:newKey];
                 }
             }
         } else {
             params[key] = val;
         }
         // params[kv[0]] = val;
    }];
    return params;
}

@end
