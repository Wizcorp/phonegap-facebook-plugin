//
//  FacebookConnectPlugin.m
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Copyright 2011 Nitobi. All rights reserved.
//

#import "FacebookConnectPlugin.h"
#import "JSON.h"


@implementation FacebookConnectPlugin

@synthesize facebook;


- (void) initWithAppId:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
	NSString* appId = [arguments objectAtIndex:0];
	facebook = [[Facebook alloc] initWithAppId:appId];
	
// TODO: pass in permissions
//	NSArray* permissions =  [[NSArray arrayWithObjects:
//							  @"email", @"read_stream", nil] retain];
//	
//	
//	[facebook authorize:permissions delegate:self];
}

-(void) authorize:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
	[facebook authorize:arguments delegate:self];
}

-(void) logout:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
	[facebook logout:self];
}

-(void) handleOpenUrl:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
	NSURL* url = [NSURL URLWithString:[arguments objectAtIndex:0]];
	[facebook handleOpenURL:url];
}

-(void) showFeedPublishDialog:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
	[facebook dialog:@"feed" andDelegate:self];
}

/**
 * Called when the user successfully logged in.
 */
- (void)fbDidLogin
{
	 // [facebook dialog:@"feed" andDelegate:self];
	//[facebook requestWithGraphPath:@"me/friends" andDelegate:self];
	NSString* jsResult = [NSString stringWithFormat:@"FacebookGap.onLogin();"];
	[self.webView stringByEvaluatingJavaScriptFromString:jsResult];
	
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
