//
//  FacebookConnectPlugin.m
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Updated by Mathijs de Bruin on 11-08-25.
//  Copyright 2011 Nitobi, Mathijs de Bruin. All rights reserved.
//

#import "FacebookConnectPlugin.h"
#import "JSON.h"

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
            if (!error) {
                // We have a valid session
                
                // Initiate a Facebook instance
                self.facebook = [[Facebook alloc]
                                 initWithAppId:FBSession.activeSession.appID
                                 andDelegate:nil];
                
                // Store the Facebook session information
                self.facebook.accessToken = FBSession.activeSession.accessToken;
                self.facebook.expirationDate = FBSession.activeSession.expirationDate;
                
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

- (void) init:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    if ([arguments count] < 2) {
        return;
    }
    
    self.userid = @"";
        NSString* callbackId = [arguments objectAtIndex:0];
    
    // No need to use this right now, store it?
        //NSString* appId = [arguments objectAtIndex:1];
    
    [FBSession openActiveSessionWithPermissions:nil
                                   allowLoginUI:NO
                              completionHandler:^(FBSession *session,
                                                  FBSessionState state,
                                                  NSError *error) {
                                  [self sessionStateChanged:session
                                                      state:state
                                                      error:error];
                              }];
    
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [super writeJavascript:[result toSuccessCallbackString:callbackId]];
}

- (void) getLoginStatus:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSString* callbackId = [arguments objectAtIndex:0]; // first item is the callbackId
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self responseObject]];
    NSString* callback = [pluginResult toSuccessCallbackString:callbackId];
    // we need to wrap the callback in a setTimeout(func, 0) so it doesn't block the UI (handleOpenURL limitation)
    [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];
}

- (void) login:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    if ([arguments count] < 2) {
        return;
    }
        
    NSString* callbackId = [arguments objectAtIndex:0];// first item is the callbackId
    
    NSMutableArray* marray = [NSMutableArray arrayWithArray:arguments];
    [marray removeObjectAtIndex:0]; // first item is the callbackId
    
    // save the callbackId for the login callback
    self.loginCallbackId = callbackId;
    
    [FBSession openActiveSessionWithPermissions:marray
                                   allowLoginUI:YES
                              completionHandler:^(FBSession *session,
                                                  FBSessionState state,
                                                  NSError *error) {
                                  [self sessionStateChanged:session
                                                      state:state
                                                      error:error];
                              }];
    
    [super writeJavascript:nil];
}

- (void) logout:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    if (!FBSession.activeSession.isOpen) {
        return;
    }
    
    NSString* callbackId = [arguments objectAtIndex:0]; // first item is the callbackId
    
    // Close the session and clear the cache
        [FBSession.activeSession closeAndClearTokenInformation];
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [super writeJavascript:[pluginResult toSuccessCallbackString:callbackId]];
}

- (void) showDialog:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSString* callbackId = [arguments objectAtIndex:0]; // first item is the callbackId
    
    // Save the callback ID
    self.dialogCallbackId = callbackId;
    
    NSString* method = [[NSString alloc] initWithString:[options objectForKey:@"method"]];
    if ([options objectForKey:@"method"]) {
        [options removeObjectForKey:@"method"];
    }
    NSMutableDictionary *params = [[NSMutableDictionary alloc] init];
    for (id key in options) {
        if ([[options objectForKey:key] isKindOfClass:[NSString class]]) {
            [params setObject:[options objectForKey:key] forKey:key];
        } else {
            SBJSON *jsonWriter = [[SBJSON new] autorelease];
            NSString *paramString = [jsonWriter stringWithObject:[options objectForKey:key]];
            [params setObject:paramString forKey:key];
        }
    }
        [self.facebook dialog:method andParams:params andDelegate:self];
    [method release];
    [params release];
    
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
