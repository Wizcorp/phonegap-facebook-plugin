//
//  FacebookConnectPlugin.m
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Updated by Mathijs de Bruin on 11-08-25.
//  Updated by Christine Abernathy on 13-01-22
//  Updated by Michael Go on 14-12-29
//  Copyright 2011 Nitobi, Mathijs de Bruin. All rights reserved.

// AppGyver: *** The FacebookConnectPlugin class was modified to use the Plugin Wrapper Singleton which is reused across multiple webviews ***
//



#import "FacebookConnectPlugin.h"

@interface FacebookConnectPlugin ()

@property (strong, nonatomic) NSString* loginCallbackId;
@property (strong, nonatomic) NSString* dialogCallbackId;

@end

@implementation FacebookConnectPlugin

- (CDVPlugin *)initWithWebView:(UIWebView *)theWebView {
    self = (FacebookConnectPlugin *)[super initWithWebView:theWebView];
    
    [self setupNotificationHandlers];
    
    return self;
}


- (void) setupNotificationHandlers {
    
     __weak typeof (self) weakSelf = self;
    
    [[NSNotificationCenter defaultCenter]
     addObserverForName:@"FB_PLUGIN_SESSION_STATE_OPEN"
     object:[FacebookWrapperSingleton instance]
     queue:nil
     usingBlock:^(NSNotification *note) {
         
         __strong typeof (self) strongSelf = weakSelf;
         
         if(strongSelf.loginCallbackId){
             CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                           messageAsDictionary:[[FacebookWrapperSingleton instance] getStatusDictionary]];
             [strongSelf.commandDelegate sendPluginResult:pluginResult callbackId:strongSelf.loginCallbackId];
             
         }
     }];
    
    [[NSNotificationCenter defaultCenter]
     addObserverForName:@"FB_PLUGIN_SESSION_STATE_ERROR"
     object:[FacebookWrapperSingleton instance]
     queue:nil
     usingBlock:^(NSNotification *note) {
         
         __strong typeof (self) strongSelf = weakSelf;
         
         if(strongSelf.loginCallbackId){
             CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                               messageAsString:note.userInfo[@"errorMessage"]];
             [strongSelf.commandDelegate sendPluginResult:pluginResult callbackId:strongSelf.loginCallbackId];
             
         }
     }];
    
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
                                                  messageAsDictionary:[[FacebookWrapperSingleton instance] getStatusDictionary]];
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
    if ([command.arguments count] != 2) {
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
            [[FacebookWrapperSingleton instance] requestNewPublishPermissions:permissions defaultAudience:FBSessionDefaultAudienceFriends];
            
        } else {
            // Only read permissions
            [[FacebookWrapperSingleton instance] requestNewReadPermissions:permissions];
            
        }
    } else {
        // Initial log in, can only ask to read
        // type permissions
        if ([self areAllPermissionsReadPermissions:permissions]) {
            
            [[FacebookWrapperSingleton instance] openActiveSessionWithReadPermissions:permissions allowLoginUI:YES];
            
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
 
    [[FacebookWrapperSingleton instance] logout];
    
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
        [[FacebookWrapperSingleton instance] requestNewReadPermissions:requestPermissions withBlock:^(FBSession *session, NSError *error) {
            if (!error) {
                // Permission granted
                NSLog(@"new permissions %@", [FBSession.activeSession permissions]);
                // We can request the user information
                [self makeGraphCall:graphPath callbackId:command.callbackId];
            } else {
                // An error occurred, we need to handle the error
                // See: https://developers.facebook.com/docs/ios/errors
            }
        }];
        
    } else {
        // Permissions are present
        // We can request the user information
        [self makeGraphCall:graphPath callbackId:command.callbackId];
    }
}

- (void) makeGraphCall:(NSString *)graphPath callbackId:(NSString *)callbackId
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
         [self.commandDelegate sendPluginResult:pluginResult callbackId:callbackId];
     }];
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
