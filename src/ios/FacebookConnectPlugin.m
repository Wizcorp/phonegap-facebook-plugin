//
//  FacebookConnectPlugin.m
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Updated by Mathijs de Bruin on 11-08-25.
//  Copyright 2011 Nitobi, Mathijs de Bruin. All rights reserved.
//

#import "FacebookConnectPlugin.h"
#import "FBSBJSON.h"

@interface FacebookConnectPlugin ()
<FBDialogDelegate>

@property (strong, nonatomic) Facebook *facebook;
@property (strong, nonatomic) NSString *userid;

@property (strong, nonatomic) NSString* loginCallbackId;
@property (strong, nonatomic) NSString* dialogCallbackId;

- (NSDictionary*) responseObject;

@end

@implementation FacebookConnectPlugin

@synthesize facebook = _facebook;
@synthesize userid = _userid;
@synthesize loginCallbackId = _loginCallbackId;
@synthesize dialogCallbackId = _dialogCallbackId;

/* This overrides CDVPlugin's method, which receives a notification when handleOpenURL is called on the main app delegate */
- (void) handleOpenURL:(NSNotification*)notification
{
        NSURL* url = [notification object];

        if (![url isKindOfClass:[NSURL class]]) {
        return;
        }
    
        [FBSession.activeSession handleOpenURL:url];
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
                
                if (nil == self.facebook) {
                    // Initiate a Facebook instance
                    self.facebook = [[Facebook alloc]
                                     initWithAppId:FBSession.activeSession.appID
                                     andDelegate:nil];
                }
                
                // Store the Facebook session information
                self.facebook.accessToken = FBSession.activeSession.accessToken;
                self.facebook.expirationDate = FBSession.activeSession.expirationDate;
                
                if (state == FBSessionStateOpen) {
                    // Get the user's info
                    [FBRequestConnection startForMeWithCompletionHandler:
                     ^(FBRequestConnection *connection, id <FBGraphUser>user, NSError *error) {
                         if (!error) {
                             self.userid = user.id;
                             CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:
                                                              [self responseObject]];
                             NSString* callback = [pluginResult toSuccessCallbackString:self.loginCallbackId];
                             // we need to wrap the callback in a setTimeout(func, 0) so it doesn't block the UI (handleOpenURL limitation)
                             [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];
                         } else {
                             self.userid = @"";
                             
                         }
                     }];
                }
                
                // Send the plugin result
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:
                                                 [self responseObject]];
                NSString* callback = [pluginResult toSuccessCallbackString:self.loginCallbackId];
                
                // we need to wrap the callback in a setTimeout(func, 0) so it doesn't block the UI (handleOpenURL limitation)
                [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];
            }
            break;
        case FBSessionStateClosed:
        case FBSessionStateClosedLoginFailed:
            [FBSession.activeSession closeAndClearTokenInformation];
            // Clear out the Facebook instance
            self.facebook = nil;
            self.userid = @"";
            break;
        default:
            break;
    }
    
    if (error) {
        UIAlertView *alertView = [[UIAlertView alloc]
                                  initWithTitle:@"Error"
                                  message:error.localizedDescription
                                  delegate:nil
                                  cancelButtonTitle:@"OK"
                                  otherButtonTitles:nil];
        [alertView show];
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

- (void) init:(CDVInvokedUrlCommand*)command
{    
    self.userid = @"";
    
    // No need to use this right now, store it?
        //NSString* appId = [command.arguments objectAtIndex:0];
    
    [FBSession openActiveSessionWithReadPermissions:nil
                                   allowLoginUI:NO
                              completionHandler:^(FBSession *session,
                                                  FBSessionState state,
                                                  NSError *error) {
                                  [self sessionStateChanged:session
                                                      state:state
                                                      error:error];
                              }];
    
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [super writeJavascript:[result toSuccessCallbackString:command.callbackId]];
}

- (void) getLoginStatus:(CDVInvokedUrlCommand*)command
{    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self responseObject]];
    NSString* callback = [pluginResult toSuccessCallbackString:command.callbackId];
    // we need to wrap the callback in a setTimeout(func, 0) so it doesn't block the UI (handleOpenURL limitation)
    [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];
}

- (void) login:(CDVInvokedUrlCommand*)command
{    
    NSArray *permissions = nil;
    if ([command.arguments count] > 0) {
        permissions = command.arguments;
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
            // Mix of permissions, use deprecated method
            [FBSession.activeSession
             reauthorizeWithPermissions:permissions
             behavior:FBSessionLoginBehaviorWithFallbackToWebView
             completionHandler:^(FBSession *session, NSError *error) {
                 [self sessionStateChanged:session
                                     state:session.state
                                     error:error];
             }];
        } else if (publishPermissionFound) {
            // Only publish permissions
            [FBSession.activeSession
             reauthorizeWithPublishPermissions:permissions
             defaultAudience:FBSessionDefaultAudienceFriends
             completionHandler:^(FBSession *session, NSError *error) {
                [self sessionStateChanged:session
                                    state:session.state
                                    error:error];
             }];
        } else {
            // Only read permissions
            [FBSession.activeSession
             reauthorizeWithReadPermissions:permissions
             completionHandler:^(FBSession *session, NSError *error) {
                 [self sessionStateChanged:session
                                     state:session.state
                                     error:error];
             }];
        }
    } else {
        // Initial log in, can only ask to read
        // type permissions if one wants to use the
        // non-deprecated open session methods and
        // take advantage of iOS6 integration
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
            // Use deprecated methods for backward compatibility
            [FBSession
             openActiveSessionWithPermissions:permissions
             allowLoginUI:YES completionHandler:^(FBSession *session,
                                                  FBSessionState state,
                                                  NSError *error) {
                 [self sessionStateChanged:session
                                     state:state
                                     error:error];
             }];
        }
        
        
        
    }
    
    [super writeJavascript:nil];
}

- (void) logout:(CDVInvokedUrlCommand*)command
{
    if (!FBSession.activeSession.isOpen) {
        return;
    }
    
    // Close the session and clear the cache
        [FBSession.activeSession closeAndClearTokenInformation];
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [super writeJavascript:[pluginResult toSuccessCallbackString:command.callbackId]];
}

- (void) showDialog:(CDVInvokedUrlCommand*)command
{
    // Save the callback ID
    self.dialogCallbackId = command.callbackId;
    
    NSMutableDictionary *options = [command.arguments lastObject];
    NSString* method = [[NSString alloc] initWithString:[options objectForKey:@"method"]];
    if ([options objectForKey:@"method"]) {
        [options removeObjectForKey:@"method"];
    }
    NSMutableDictionary *params = [[NSMutableDictionary alloc] init];
    for (id key in options) {
        if ([[options objectForKey:key] isKindOfClass:[NSString class]]) {
            [params setObject:[options objectForKey:key] forKey:key];
        } else {
            // For optional ARC support
            #if __has_feature(objc_arc)
                FBSBJSON *jsonWriter = [FBSBJSON new];
            #else
                FBSBJSON *jsonWriter = [[FBSBJSON new] autorelease];
            #endif
            NSString *paramString = [jsonWriter stringWithObject:[options objectForKey:key]];
            [params setObject:paramString forKey:key];
        }
    }
        [self.facebook dialog:method andParams:params andDelegate:self];
    
    // For optional ARC support
    #if __has_feature(objc_arc)
    #else
        [method release];
        [params release];
    #endif
    
    [super writeJavascript:nil];
}

- (void) dealloc
{
    self.facebook = nil;
    [super dealloc];
}

- (NSDictionary*) responseObject
{
    NSString* status = @"unknown";
    NSDictionary* sessionDict = nil;
    
    NSTimeInterval expiresTimeInterval = [FBSession.activeSession.expirationDate timeIntervalSinceNow];
    NSString* expiresIn = @"0";
    if (expiresTimeInterval > 0) {
        expiresIn = [NSString stringWithFormat:@"%0.0f", expiresTimeInterval];
    }
    
    if (FBSession.activeSession.isOpen) {
        
        status = @"connected";
        sessionDict = [NSDictionary dictionaryWithObjects: [NSArray arrayWithObjects:
                          FBSession.activeSession.accessToken, 
                          expiresIn,
                          @"...",
                          [NSNumber numberWithBool:YES], 
                          @"...", 
                          self.userid, 
                          nil] 
                forKeys:[NSArray arrayWithObjects:
                         @"accessToken", 
                         @"expiresIn", 
                         @"secret", 
                         @"session_key", 
                         @"sig", 
                         @"userID", 
                         nil]];
    }
    
    NSMutableDictionary *statusDict = [NSMutableDictionary dictionaryWithObject:status forKey:@"status"];
    if (nil != sessionDict) {
        [statusDict setObject:sessionDict forKey:@"authResponse"];
    }
        
    return statusDict;
}

/**
 * A function for parsing URL parameters.
 */
- (NSDictionary*)parseURLParams:(NSString *)query {
    NSArray *pairs = [query componentsSeparatedByString:@"&"];
    NSMutableDictionary *params = [[NSMutableDictionary alloc] init];
    for (NSString *pair in pairs) {
        NSArray *kv = [pair componentsSeparatedByString:@"="];
        NSString *val =
        [[kv objectAtIndex:1]
         stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
        
        [params setObject:val forKey:[kv objectAtIndex:0]];
    }
    return params;
}

////////////////////////////////////////////////////////////////////
// FBDialogDelegate

/**
 * Called when the dialog succeeds and is about to be dismissed.
 */
- (void)dialogDidComplete:(FBDialog *)dialog
{
        // TODO
}

/**
 * Called when the dialog succeeds with a returning url.
 */
- (void)dialogCompleteWithUrl:(NSURL *)url
{       
    // Send the URL parameters back, for a requests dialog, the "request" parameter
    // will include the resutling request id. For a feed dialog, the "post_id"
    // parameter will include the resulting post id.
    NSDictionary *params = [self parseURLParams:[url query]];
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:params];
    NSString* callback = [pluginResult toSuccessCallbackString:self.dialogCallbackId];
    [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];
}

/**
 * Called when the dialog get canceled by the user.
 */
- (void)dialogDidNotCompleteWithUrl:(NSURL *)url
{
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT];
    NSString* callback = [pluginResult toSuccessCallbackString:self.dialogCallbackId];
    [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];
}

/**
 * Called when the dialog is cancelled and is about to be dismissed.
 */
- (void)dialogDidNotComplete:(FBDialog *)dialog
{
        // TODO 
}

/**
 * Called when dialog failed to load due to an error.
 */
- (void)dialog:(FBDialog*)dialog didFailWithError:(NSError *)error
{
        
}

/**
 * Asks if a link touched by a user should be opened in an external browser.
 *
 * If a user touches a link, the default behavior is to open the link in the Safari browser,
 * which will cause your app to quit.  You may want to prevent this from happening, open the link
 * in your own internal browser, or perhaps warn the user that they are about to leave your app.
 * If so, implement this method on your delegate and return NO.  If you warn the user, you
 * should hold onto the URL and once you have received their acknowledgement open the URL yourself
 * using [[UIApplication sharedApplication] openURL:].
 */
- (BOOL)dialog:(FBDialog*)dialog shouldOpenURLInExternalBrowser:(NSURL *)url
{
        // TODO: pass this back to JS
        return NO;
}

@end
