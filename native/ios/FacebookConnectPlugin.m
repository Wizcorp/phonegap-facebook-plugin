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

#define APP_SECRET  @"3fa440c0919afdd20a957c6cce288480"

@implementation FacebookConnectPlugin

@synthesize facebook, loginCallbackId;

/* This overrides PGPlugin's method, which receives a notification when handleOpenURL is called on the main app delegate */
- (void) handleOpenURL:(NSNotification*)notification
{
	NSURL* url = [notification object];

	if (![url isKindOfClass:[NSURL class]]) {
        return;
	}
    
	[facebook handleOpenURL:url];
}

- (void) init:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    if ([arguments count] < 2) {
        return;
    }
    
	NSString* callbackId = [arguments objectAtIndex:0];
	NSString* appId = [arguments objectAtIndex:1];
	self.facebook = [[Facebook alloc] initWithAppId:appId andDelegate: self];
	    
    PluginResult* result = [PluginResult resultWithStatus:PGCommandStatus_OK];
    [super writeJavascript:[result toSuccessCallbackString:callbackId]];
}

- (void) getLoginStatus:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSString* callbackId = [arguments objectAtIndex:0]; // first item is the callbackId
    
    PluginResult* pluginResult = [PluginResult resultWithStatus:PGCommandStatus_OK messageAsDictionary:[self responseObject]];
    NSString* callback = [pluginResult toSuccessCallbackString:callbackId];
    // we need to wrap the callback in a setTimeout(func, 0) so it doesn't block the UI (handleOpenURL limitation)
    [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];
}

- (void) login:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    if ([arguments count] < 2 || !self.facebook) {
        return;
    }
        
    NSString* callbackId = [arguments objectAtIndex:0];// first item is the callbackId
    BOOL validSession = [self.facebook isSessionValid];

    PluginResult* result = nil;
    NSString* jsString = nil;
    
    if (validSession) {
        result = [PluginResult resultWithStatus:PGCommandStatus_OK];
        jsString = [result toSuccessCallbackString:callbackId];
        
    } else {
        NSMutableArray* marray = [NSMutableArray arrayWithArray:arguments];
        [marray removeObjectAtIndex:0]; // first item is the callbackId
        
        // save the callbackId for the login callback
        self.loginCallbackId = callbackId;
        
        return [facebook authorize:marray];
    }
    
    [super writeJavascript:jsString];
}

- (void) logout:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    if (!self.facebook) {
        return;
    }
    
    NSString* callbackId = [arguments objectAtIndex:0]; // first item is the callbackId
    
	[facebook logout:self];
    
    PluginResult* pluginResult = [PluginResult resultWithStatus:PGCommandStatus_OK];
    [super writeJavascript:[pluginResult toSuccessCallbackString:callbackId]];
}

- (void) showFeedPublishDialog:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSString* callbackId = [arguments objectAtIndex:0]; // first item is the callbackId

	[facebook dialog:@"feed" andDelegate:self];

    PluginResult* pluginResult = [PluginResult resultWithStatus:PGCommandStatus_NO_RESULT];
    NSString* callback = [pluginResult toSuccessCallbackString:callbackId];
    [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];
}

- (void) showDialog:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSString* callbackId = [arguments objectAtIndex:0]; // first item is the callbackId
    NSString* method = [[NSString alloc] initWithString:[options objectForKey:@"method"]];
    if ([options objectForKey:@"method"]) {
        [options removeObjectForKey:@"method"];
    }
	[facebook dialog:method andParams:options andDelegate:self];
    [method release];
    
    PluginResult* pluginResult = [PluginResult resultWithStatus:PGCommandStatus_NO_RESULT];
    NSString* callback = [pluginResult toSuccessCallbackString:callbackId];
    [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];
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
    
    if (self.facebook && [self.facebook isSessionValid]) {
        
        status = @"connected";
        sessionDict = [NSDictionary dictionaryWithObjects: [NSArray arrayWithObjects:
                          self.facebook.accessToken, 
                          [self.facebook.expirationDate description], 
                          APP_SECRET, 
                          [NSNumber numberWithBool:YES], 
                          @"...", 
                          @"...", 
                          nil] 
                forKeys:[NSArray arrayWithObjects:
                         @"accessToken", 
                         @"expiresIn", 
                         @"secret", 
                         @"session_key", 
                         @"sig", 
                         @"userID", 
                         nil]];
    } else {
        sessionDict = [[NSDictionary new] autorelease];
    }
    
    NSDictionary* statusDict = [NSDictionary dictionaryWithObjects:[NSArray arrayWithObjects:
                                 status, 
                                 sessionDict, 
                                 nil] 
                        forKeys:[NSArray arrayWithObjects:
                                 @"status", 
                                 @"session", 
                                 nil]];
        
    return statusDict;
}

/**
 * Called when the user successfully logged in.
 */
- (void) fbDidLogin
{
    [facebook requestWithGraphPath:@"me" andDelegate:self];
    
    PluginResult* pluginResult = [PluginResult resultWithStatus:PGCommandStatus_OK messageAsDictionary:
                            [self responseObject]];
    NSString* callback = [pluginResult toSuccessCallbackString:self.loginCallbackId];

    // we need to wrap the callback in a setTimeout(func, 0) so it doesn't block the UI (handleOpenURL limitation)
    [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];

}

- (void)fbDidLogout {
}

- (void)fbDidNotLogin:(BOOL)cancelled {
}

- (void)fbDidExtendToken:(NSString*)accessToken
               expiresAt:(NSDate*)expiresAt {
}

- (void)fbSessionInvalidated {
}

////////////////////////////////////////////////////////////////////
// FBRequestDelegate

///**
// * Called just before the request is sent to the server.
// */
//- (void)requestLoading:(FBRequest *)request
//{
//	
//}

///**
// * Called when the server responds and begins to send back data.
// */
//- (void)request:(FBRequest *)request didReceiveResponse:(NSURLResponse *)response
//{
//	
//}

/**
 * Called when an error prevents the request from completing successfully.
 */
- (void)request:(FBRequest *)request didFailWithError:(NSError *)error
{
	
}

/**
 * Called when a request returns and its response has been parsed into
 * an object. This is called only by the Graph API call to get the UID
 *
 * The resulting object may be a dictionary, an array, a string, or a number,
 * depending on thee format of the API response.
 */
- (void) request:(FBRequest *)request didLoad:(id)result
{    
    PluginResult* pluginResult = [PluginResult resultWithStatus:PGCommandStatus_OK messageAsDictionary:
                                  [self responseObject]];
    NSString* callback = [pluginResult toSuccessCallbackString:self.loginCallbackId];
    // we need to wrap the callback in a setTimeout(func, 0) so it doesn't block the UI (handleOpenURL limitation)
    [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];
}

///**
// * Called when a request returns a response.
// *
// * The result object is the raw response from the server of type NSData
// */
//- (void)request:(FBRequest *)request didLoadRawResponse:(NSData *)data
//{
//	
//}



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
	// TODO	
}

/**
 * Called when the dialog get canceled by the user.
 */
- (void)dialogDidNotCompleteWithUrl:(NSURL *)url
{
	// TODO	
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
