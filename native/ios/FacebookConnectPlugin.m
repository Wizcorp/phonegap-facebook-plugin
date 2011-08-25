//
//  FacebookConnectPlugin.m
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Updated by Mathijs de Bruin on 11-08-25.
//  Copyright 2011 Nitobi, Mathijs de Bruin. All rights reserved.
//

#import "FacebookConnectPlugin.h"
#ifdef PHONEGAP_FRAMEWORK
    #import <PhoneGap/JSON.h>
    #import <PhoneGap/PluginResult.h>
#else
    #import "JSON.h"
    #import "PluginResult.h"
#endif

#define APP_SECRET  @"b082c4620cdac27e0371f2c674026662"

@implementation FacebookConnectPlugin

@synthesize facebook, loginCallbackId;

/* This overrides PGPlugin's method, which receives a notification when handleOpenURL is called on the main app delegate */
- (void) handleOpenURL:(NSNotification*)notification
{
	NSURL* url = [notification object];

    // What exactly does this check for?
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
    NSString* callbackId = [arguments objectAtIndex:0];// first item is the callbackId
    
    PluginResult* result = [PluginResult resultWithStatus:self.facebook? PGCommandStatus_OK : PGCommandStatus_ERROR];
    [super writeJavascript:[result toSuccessCallbackString:callbackId]];
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
    
    if (validSession) 
    {
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
    
    NSString* callbackId = [arguments objectAtIndex:0];// first item is the callbackId
    
	[facebook logout:self];
    
    PluginResult* result = [PluginResult resultWithStatus:PGCommandStatus_OK];
    [super writeJavascript:[result toSuccessCallbackString:callbackId]];
}

- (void) showFeedPublishDialog:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSString* callbackId = [arguments objectAtIndex:0];// first item is the callbackId
    
	[facebook dialog:@"feed" andDelegate:self];
    
    PluginResult* result = [PluginResult resultWithStatus:PGCommandStatus_NO_RESULT];
    [super writeJavascript:[result toSuccessCallbackString:callbackId]];
}

- (void) dealloc
{
    self.facebook = nil;
    [super dealloc];
}

/**
 * Called when the user successfully logged in.
 */
- (void)fbDidLogin
{
	 // [facebook dialog:@"feed" andDelegate:self];
	//[facebook requestWithGraphPath:@"me/friends" andDelegate:self];
    // NSString* jsResult = [NSString stringWithFormat:@"FacebookGap.onLogin();"];

    NSDictionary* session = [NSDictionary
                             dictionaryWithObjects:[NSArray arrayWithObjects:self.facebook.accessToken, [self.facebook.expirationDate description], APP_SECRET, [NSNumber numberWithBool:YES], @"...", @"...", nil] 
                             forKeys:[NSArray arrayWithObjects:@"access_token", @"expires", @"secret", @"session_key", @"sig", @"uid", nil]];
    NSDictionary* status = [NSDictionary
                             dictionaryWithObjects:[NSArray arrayWithObjects:@"connected", session, nil] 
                             forKeys:[NSArray arrayWithObjects:@"status", @"session", nil]];



    PluginResult* result = [PluginResult resultWithStatus:PGCommandStatus_OK messageAsDictionary:status];
    NSString* callback = [result toSuccessCallbackString:self.loginCallbackId];

    // we need to wrap the callback in a setTimeout(func, 0) so it doesn't block the UI (handleOpenURL limitation)
    [super writeJavascript:[NSString stringWithFormat:@"setTimeout(function() { %@; }, 0);", callback]];
	
}

/**
 * Called when the user dismissed the dialog without logging in.
 */
- (void)fbDialogNotLogin:(BOOL)cancelled
{
	// this NEVER seems to happen
	NSString* jsResult = [NSString stringWithFormat:@"FacebookGap.onDidNotLogin(%d);",cancelled];
	[self.webView stringByEvaluatingJavaScriptFromString:jsResult];
}

/**
 * Called when the user logged out.
 */
- (void)fbDidLogout
{
	NSString* jsResult = [NSString stringWithFormat:@"FacebookGap.onLogout();"];
	[self.webView stringByEvaluatingJavaScriptFromString:jsResult];
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
 * an object.
 *
 * The resulting object may be a dictionary, an array, a string, or a number,
 * depending on thee format of the API response.
 */
- (void)request:(FBRequest *)request didLoad:(id)result
{
	NSString* jsResult = [NSString stringWithFormat:@"fbRequestResult(%@);", [result JSONRepresentation]];
	[self.webView stringByEvaluatingJavaScriptFromString:jsResult];
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
	
}

/**
 * Called when the dialog succeeds with a returning url.
 */
- (void)dialogCompleteWithUrl:(NSURL *)url
{
	
}

/**
 * Called when the dialog get canceled by the user.
 */
- (void)dialogDidNotCompleteWithUrl:(NSURL *)url
{
	
}

/**
 * Called when the dialog is cancelled and is about to be dismissed.
 */
- (void)dialogDidNotComplete:(FBDialog *)dialog
{
	
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



/*
NSArray* permissions =  [[NSArray arrayWithObjects:
						  @"email", @"read_stream", nil] retain];

[facebook authorize:permissions delegate:self];
*/

/*
//get information about the currently logged in user
[facebook requestWithGraphPath:@"me" andDelegate:self];

//get the logged-in user's friends
[facebook requestWithGraphPath:@"me/friends" andDelegate:self];     

//call a legacy REST API
NSMutableDictionary* params = [NSMutableDictionary 
							   dictionaryWithObjectsAndKeys: @"4", @"uids", @"name", @"fields", nil];

[facebook requestWithMethodName: @"users.getInfo" 
					  andParams: params andHttpMethod: @"GET" andDelegate: self];
 
 
[facebook dialog:@"feed" andDelegate:self]; 
*/





@end
