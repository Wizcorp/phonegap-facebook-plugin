//
//  FacebookConnectPlugin.m
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Updated by Mathijs de Bruin on 11-08-25.
//  Updated by Christine Abernathy on 13-01-22.
//  Updated by Brant Watrous on 15-05-11.
//  Copyright 2011 Nitobi, Mathijs de Bruin. All rights reserved.
//

#import "FacebookConnectPlugin.h"
#import <objc/runtime.h>
#import <objc/message.h>

@interface FacebookConnectPlugin ()

@property (strong, nonatomic) NSString *loginCallbackId;
@property (strong, nonatomic) NSString *dialogCallbackId;
@property (strong, nonatomic) NSString *graphCallbackId;

@end

@implementation FacebookConnectPlugin

#pragma mark - Constructor

- (CDVPlugin *)initWithWebView:(UIWebView *)theWebView
{
    NSLog(@"Init FacebookConnect Session");

    self = (FacebookConnectPlugin *)[super initWithWebView:theWebView];

    // Automatically observe changes to [FBSDKAccessToken currentAccessToken]
    [FBSDKProfile enableUpdatesOnAccessTokenChange:YES];

    // Should be invoked early for proper functioning of the Facebook SDK.
    [[FBSDKApplicationDelegate sharedInstance] application:[UIApplication sharedApplication] didFinishLaunchingWithOptions:nil];

    // Add notification listener for tracking app activity with FB Events
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationBecameActive:)
                                                 name:UIApplicationDidBecomeActiveNotification object:nil];
    // Add notification listener for profile change
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(profileChange:)
                                                 name:FBSDKProfileDidChangeNotification object:nil];
    // Add notification listener for token change
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(tokenChange:)
                                                 name:FBSDKAccessTokenDidChangeNotification object:nil];
    return self;
}



#pragma mark - Cordova Notifications

- (void)applicationBecameActive:(NSNotification *)notfication
{
    NSLog(@"Application became active");

    // Call 'activateApp' to log an app event for use
    // in analytics and advertising reporting.
    [FBSDKAppEvents activateApp];

    // Do the following if you use Mobile App Engagement Ads to get the deferred
    // app link after your app is installed.
    [FBSDKAppLinkUtility fetchDeferredAppLink:^(NSURL *url, NSError *error) {
        if (error) {
            // NSLog(@"Received error while fetching deferred app link %@", error);
        }
        if (url) { /* && [[UIApplication sharedApplication] canOpenURL:url] */
            [[UIApplication sharedApplication] openURL:url];
        }
    }];
}



#pragma mark - FBSDK Notifications

- (void)profileChange:(NSNotification *)notfication
{
    NSLog(@"Profile changed: %@", [self sessionInfo]);

    if ([FBSDKProfile currentProfile]) {
        // Send the plugin result with user's info
        if (self.loginCallbackId)
        {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self sessionInfo]];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.loginCallbackId];
        }
    }
}

- (void)tokenChange:(NSNotification *)notfication
{
    NSLog(@"Token changed: %@", [self sessionInfo]);

    if ([FBSDKAccessToken currentAccessToken]) {
        [self profileChange:nil];
    }

}



#pragma mark - Permissions

/*
 * Check if a permision is a read permission.
 * https://developers.facebook.com/docs/facebook-login/permissions#reference
 */
- (BOOL)isPublishPermission:(NSString *)permission
{
    return [permission hasPrefix:@"publish"] ||
    [permission hasPrefix:@"manage"] ||
    [permission isEqualToString:@"ads_management"] ||
    [permission isEqualToString:@"create_event"] ||
    [permission isEqualToString:@"rsvp_event"];
}

/*
 * Check if a permision is an extended permission.
 * https://developers.facebook.com/docs/facebook-login/permissions#reference-extended
 */
/*- (BOOL)isExtendedPermission:(NSString *)permission
{
    return [self isPublishPermission:permission] ||
    [permission isEqualToString:@"read_friendlists"] ||
    [permission isEqualToString:@"read_insights"] ||
    [permission isEqualToString:@"read_mailbox"] ||
    [permission isEqualToString:@"read_page_mailboxes"] ||
    [permission isEqualToString:@"read_stream"];
}*/

/*
 * Check if all permissions are read permissions.
 */
- (BOOL)areAllPermissionsReadPermissions:(NSArray *)permissions
{
    for (NSString *permission in permissions) {
        if ([self isPublishPermission:permission]) {
            return NO;
        }
    }
    return YES;
}



#pragma mark - Cordova API

- (void)getLoginStatus:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self sessionInfo]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}


- (void)getProfile:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:[self profileInfo]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}


- (void)getAccessToken:(CDVInvokedUrlCommand *)command
{
    // Return access token if available
    CDVPluginResult *pluginResult = nil;

    // Check if an access token exists
    if ([FBSDKAccessToken currentAccessToken]) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:[FBSDKAccessToken currentAccessToken].tokenString];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Session not open."];
    }
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}


- (void)logEvent:(CDVInvokedUrlCommand *)command
{
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
        CDVPluginResult *res = nil;
        NSDictionary *params = nil;
        double value;

        if ([command.arguments count] == 1) {
            [FBSDKAppEvents logEvent:eventName];
        } else {
            // argument count is not 0 or 1, must be 2 or more
            params = [command.arguments objectAtIndex:1];
            if ([command.arguments count] == 2) {
                // If count is 2 we will just send params
                [FBSDKAppEvents logEvent:eventName parameters:params];
            }
            if ([command.arguments count] == 3) {
                // If count is 3 we will send params and a value to sum
                value = [[command.arguments objectAtIndex:2] doubleValue];
                [FBSDKAppEvents logEvent:eventName valueToSum:value parameters:params];
            }
        }
        res = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:res callbackId:command.callbackId];
    }];
}


- (void)logPurchase:(CDVInvokedUrlCommand *)command
{
    /*
     While calls to logEvent can be made to register purchase events,
     there is a helper method that explicitly takes a currency indicator.
     */
    CDVPluginResult *res = nil;
    if ([command.arguments count] != 2)
    {
        res = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Invalid arguments"];
        [self.commandDelegate sendPluginResult:res callbackId:command.callbackId];
        return;
    }
    double value = [[command.arguments objectAtIndex:0] doubleValue];
    NSString *currency = [command.arguments objectAtIndex:1];
    [FBSDKAppEvents logPurchase:value currency:currency];

    res = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:res callbackId:command.callbackId];
}


- (void)login:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult *pluginResult = nil;
    FBSDKLoginManager *login = [[FBSDKLoginManager alloc] init];
    NSString *permissionsErrorMessage = @"";
    BOOL permissionsAllowed = YES;

    NSArray *permissions = nil;
    if ([command.arguments count] > 0) {
        permissions = command.arguments;
    }
    if (permissions == nil) {
        // Permissions expected
        permissionsErrorMessage = @"No permissions specified at login";
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                         messageAsString:permissionsErrorMessage];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
    }

    // Save the callbackId for the login callback
    self.loginCallbackId = command.callbackId;

    // Check if the session is open or not
    if ([FBSDKAccessToken currentAccessToken]) {
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
            [login logInWithPublishPermissions:permissions handler:^(FBSDKLoginManagerLoginResult *result, NSError *error) {
                NSLog(@"granted permissions %@", result.grantedPermissions);
            }];
        } else {
            // Only read permissions
            [login logInWithReadPermissions:permissions handler:^(FBSDKLoginManagerLoginResult *result, NSError *error) {
                NSLog(@"granted permissions %@", result.grantedPermissions);
            }];
        }
    }
    // Not logged in
    else {
        // Initial log in can only ask to read type permissions
        if ([self areAllPermissionsReadPermissions:permissions]) {
            [login logInWithReadPermissions:permissions handler:^(FBSDKLoginManagerLoginResult *result, NSError *error) {
                NSLog(@"granted permissions %@", result.grantedPermissions);
            }];
        } else {
            permissionsAllowed = NO;
            permissionsErrorMessage = @"You can only ask for read permissions initially";
        }
    }

    if (!permissionsAllowed) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                         messageAsString:permissionsErrorMessage];
    }
}


- (void)logout:(CDVInvokedUrlCommand *)command
{
    if ([FBSDKAccessToken currentAccessToken]) {
        // Close the session and clear the cache
        [[[FBSDKLoginManager alloc] init] logOut];
    }
    // Return OK we are already logged out
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}


/*- (void)switchAccounts:(CDVInvokedUrlCommand *)command
{
    // If you want to switch accounts, save the currentAccessToken which
    // implements NSSecureCoding. Then set the currentAccessToken to nil,
    // and then invoke the FBSDKLoginManager.
}*/


- (void)graphApi:(CDVInvokedUrlCommand *)command
{
    // Save the callback ID
    self.graphCallbackId = command.callbackId;

    NSString *graphPath = [command argumentAtIndex:0];
    NSArray *permissionsNeeded = [command argumentAtIndex:1];
    NSDictionary *parameters = [command argumentAtIndex:2];
    NSString *httpMethod = [command argumentAtIndex:3];

    // We will store here the missing permissions that we will have to request
    NSMutableArray *requestPermissions = [[NSMutableArray alloc] initWithArray:@[]];

    // Check if all the permissions we need are present in the user's current permissions
    // If they are not present add them to the permissions to be requested
    for (NSString *permission in permissionsNeeded) {
        if (![[FBSDKAccessToken currentAccessToken].permissions containsObject:permission]) {
            [requestPermissions addObject:permission];
        }
    }

    // If we have permissions to request
    if ([requestPermissions count] > 0){
        // Ask for the missing permissions
        FBSDKLoginManager *login = [[FBSDKLoginManager alloc] init];
        [login logInWithReadPermissions:requestPermissions handler:^(FBSDKLoginManagerLoginResult *result, NSError *error) {
            if (!error) {
                // Permission granted
                NSLog(@"new permissions %@", result.grantedPermissions);
                // We can request the user information
                [self makeGraphCall:graphPath parameters:parameters method:httpMethod];
            } else {
                // An error occurred, we need to handle the error
                // See: https://developers.facebook.com/docs/ios/errors
            }
        }];
    } else {
        // Permissions are present
        // We can request the user information
        [self makeGraphCall:graphPath parameters:parameters method:httpMethod];
    }
}


- (void)showDialog:(CDVInvokedUrlCommand *)command
{
    // Save the callback ID
    self.dialogCallbackId = command.callbackId;

    NSMutableDictionary *options = [[command.arguments lastObject] mutableCopy];
    NSString *method = [[NSString alloc] initWithString:[options objectForKey:@"method"]];
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
        [self dialogErrorWithMessage:@"Error completing dialog."];
    }
    // AppInvite dialog
    else if ([method isEqualToString:@"appinvites"]) {
        FBSDKAppInviteContent *content = [[FBSDKAppInviteContent alloc] init];
        content.appLinkURL = [NSURL URLWithString:[params objectForKey:@"link"]]; // required
        content.previewImageURL = [NSURL URLWithString:[params objectForKey:@"preview"]];
        FBSDKAppInviteDialog *dialog = [[FBSDKAppInviteDialog alloc] init];
        if ([dialog canShow]) {
            [dialog setDelegate:self];
            [dialog setContent:content];
            [dialog show];
        } else {
            [self dialogErrorWithMessage:@"Unable to show appinvites dialog."];
        }
    }
    // GameRequest dialog
    else if ([method isEqualToString:@"apprequests"]) { // i.e. gamerequests

        FBSDKGameRequestContent *content = [[FBSDKGameRequestContent alloc] init];
        content.title = [params objectForKey:@"title"];
        content.message = [params objectForKey:@"message"];
        content.to = [params objectForKey:@"to"]; // array
        // content.actionType = (FBSDKGameRequestActionType)[params objectForKey:@"actionType"];
        content.suggestions = [params objectForKey:@"suggestions"]; // array
        content.objectID = [params objectForKey:@"objectID"];
        content.data = [params objectForKey:@"data"];

        FBSDKGameRequestDialog *dialog = [[FBSDKGameRequestDialog alloc] init];
        if ([dialog canShow]) {
            [dialog setDelegate:self];
            [dialog setContent:content];
            [dialog show];
        } else {
            [self dialogErrorWithMessage:@"Unable to show gamerequest dialog."];
        }
    }
    // AppGroupJoin dialog
    else if ([method isEqualToString:@"game_group_create"]) {
        FBSDKAppGroupJoinDialog *dialog = [[FBSDKAppGroupJoinDialog alloc] init];
        if ([dialog canShow]) {
            [dialog setDelegate:self];
            [dialog setGroupID:[params objectForKey:@"groupId"]];
            [dialog show];
        } else {
            [self dialogErrorWithMessage:@"Unable to show joingroup dialog."];
        }
    }
    // Sharing dialog
    else [self showSharingDialogWithMethod:method params:params];

    // For optional ARC support
    #if __has_feature(objc_arc)
    #else
        [method release];
        [params release];
        [options release];
    #endif
}



#pragma mark - Show Dialog Helpers

- (FBSDKShareLinkContent *)shareLinkContentWithParams:(NSDictionary *)params
{
    NSString *link = [params objectForKey:@"link"];
    link = link ? link : [params objectForKey:@"href"];
    NSString *title = [params objectForKey:@"name"];
    link = title ? title : [params objectForKey:@"title"];

    // Add content
    FBSDKShareLinkContent *content = [[FBSDKShareLinkContent alloc] init];
    content.contentURL = [NSURL URLWithString:link];
    content.contentTitle = title;
    content.contentDescription = [params objectForKey:@"description"];
    content.imageURL = [NSURL URLWithString:[params objectForKey:@"picture"]];

    return content;
}

- (void)showSharingDialogWithMethod:(NSString *)method params:(NSDictionary *)params
{
    // Dialog content
    FBSDKShareLinkContent *content = [self shareLinkContentWithParams:params];

    // Polymorphic share dialog
    NSObject<FBSDKSharingDialog> *shareDialog = nil;

    // Private message dialog
    if ([method isEqualToString:@"send"]) {
        shareDialog = [[FBSDKMessageDialog alloc] init];
    }
    // Share dialog
    else if ([method isEqualToString:@"share"]) {
        shareDialog = [[FBSDKShareDialog alloc] init]; // FBSDKShareDialogModeAutomatic
    }
    // Open graph dialog (https://developers.facebook.com/docs/sharing/opengraph/ios#sharedialog)
    else if ([method isEqualToString:@"share_open_graph"]) {
        shareDialog = [[FBSDKShareDialog alloc] init]; // FBSDKShareDialogModeAutomatic
    }
    // Feed dialog
    else if ([method isEqualToString:@"feed"]) {
        shareDialog = [[FBSDKShareDialog alloc] init];
        [(FBSDKShareDialog *)shareDialog setMode:FBSDKShareDialogModeFeedWeb];
    }

    // Show the dialog
    if ([shareDialog canShow]) {
        [shareDialog setDelegate:self];
        [shareDialog setShouldFailOnDataError:YES];
        [shareDialog setShareContent:content];
        if (![shareDialog show]) {
            [self dialogErrorWithMessage:@"Did not show share dialog."];
        }
    } else {
        [self dialogErrorWithMessage:@"Unable to show share dialog."];
    }
}

- (void)dialogSuccessWithDictionary:(NSDictionary *)results
{
    if (self.dialogCallbackId) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:results];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.dialogCallbackId];
    }
}

- (void)dialogErrorWithMessage:(NSString *)message
{
    if (self.dialogCallbackId) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                          messageAsString:message];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.dialogCallbackId];
    }
}



#pragma mark - Graph Helpers

- (void)makeGraphCall:(NSString *)graphPath
{
    [self makeGraphCall:graphPath parameters:nil method:nil];
}

- (void)makeGraphCall:(NSString *)graphPath parameters:(NSDictionary *)parameters
{
    [self makeGraphCall:graphPath parameters:parameters method:nil];
}

- (void)makeGraphCall:(NSString *)graphPath parameters:(NSDictionary *)parameters method:(NSString *)method
{
    NSLog(@"Graph Path = %@", graphPath);

    FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:graphPath
                                                                   parameters:parameters
                                                                   HTTPMethod:method];
    [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {

        CDVPluginResult *pluginResult = nil;
        if (!error) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:result];
        }
        else {
            if ([error.userInfo[FBSDKGraphRequestErrorGraphErrorCode] isEqual:@200]) {
                NSLog(@"Graph call had permission error");
            }
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[error localizedDescription]];
        }
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.graphCallbackId];

    }];
}

/*
 * Create a Facebook Response object that matches the one for the Javascript SDK
 */
- (NSDictionary *)sessionInfo
{
    NSString *status = @"unknown";
    NSDictionary *sessionDict = nil;
    FBSDKAccessToken *accessToken = [FBSDKAccessToken currentAccessToken];

    if ([FBSDKAccessToken currentAccessToken]) {

        NSTimeInterval expiresTimeInterval = [accessToken.expirationDate timeIntervalSinceNow];
        NSString *expiresIn = @"0";
        if (expiresTimeInterval > 0) {
            expiresIn = [NSString stringWithFormat:@"%0.0f", expiresTimeInterval];
        }

        status = @"connected";
        sessionDict = @{
                        @"accessToken" : accessToken.tokenString,
                        @"expiresIn" : expiresIn,
                        @"secret" : @"...",
                        @"session_key" : [NSNumber numberWithBool:YES],
                        @"sig" : @"...",
                        @"userID" : accessToken.userID
                        };
    }

    NSMutableDictionary *statusDict = [NSMutableDictionary dictionaryWithObject:status forKey:@"status"];
    if (nil != sessionDict) {
        [statusDict setObject:sessionDict forKey:@"authResponse"];
    }

    return statusDict;
}

/*
 * TODO: Match to the profile response of the JavaScript SDK
 */
- (NSDictionary *)profileInfo
{
    NSDictionary *profileDict = nil;

    if ([FBSDKAccessToken currentAccessToken]) {

        FBSDKProfile *profile = [FBSDKProfile currentProfile];
        profileDict = @{
                        @"id" : profile.userID,
                        @"firstName" : profile.firstName,
                        @"middleName" : profile.middleName ? profile.middleName : @"",
                        @"lastName" : profile.lastName,
                        @"linkURL" : [profile.linkURL absoluteString],
                        @"name" : profile.name
                        };
    }

    return profileDict;
}



#pragma mark - FBSDKSharingDelegate

- (void)sharer:(id<FBSDKSharing>)sharer didCompleteWithResults:(NSDictionary *)results
{
    [self dialogSuccessWithDictionary:results];
}

- (void)sharer:(id<FBSDKSharing>)sharer didFailWithError:(NSError *)error
{
    [self dialogErrorWithMessage:@"Sharing failed."];
}

- (void)sharerDidCancel:(id<FBSDKSharing>)sharer
{
    [self dialogErrorWithMessage:@"Sharing cancelled."];
}



#pragma mark - FBSDKAppInviteDialogDelegate

- (void)appInviteDialog:(FBSDKAppInviteDialog *)appInviteDialog didCompleteWithResults:(NSDictionary *)results
{
    [self dialogSuccessWithDictionary:results];
}

- (void)appInviteDialog:(FBSDKAppInviteDialog *)appInviteDialog didFailWithError:(NSError *)error
{
    [self dialogErrorWithMessage:@"App invite failed."];
}



#pragma mark - FBSDKGameRequestDialogDelegate

- (void)gameRequestDialog:(FBSDKGameRequestDialog *)gameRequestDialog didCompleteWithResults:(NSDictionary *)results
{
    [self dialogSuccessWithDictionary:results];
}

- (void)gameRequestDialog:(FBSDKGameRequestDialog *)gameRequestDialog didFailWithError:(NSError *)error
{
    [self dialogErrorWithMessage:@"Game request failed."];
}

- (void)gameRequestDialogDidCancel:(FBSDKGameRequestDialog *)gameRequestDialog
{
    [self dialogErrorWithMessage:@"Game request cancelled."];
}



#pragma mark - FBSDKAppGroupJoinDialogDelegate

- (void)appGroupJoinDialog:(FBSDKAppGroupJoinDialog *)appGroupJoinDialog didCompleteWithResults:(NSDictionary *)results
{
    [self dialogSuccessWithDictionary:results];
}

- (void)appGroupJoinDialog:(FBSDKAppGroupJoinDialog *)appGroupJoinDialog didFailWithError:(NSError *)error
{
    [self dialogErrorWithMessage:@"Join group failed."];
}

- (void)appGroupJoinDialogDidCancel:(FBSDKAppGroupJoinDialog *)appGroupJoinDialog
{
    [self dialogErrorWithMessage:@"Join group cancelled."];
}

@end



#pragma mark - AppDelegate Overrides

@implementation AppDelegate (FacebookConnectPlugin)

void FBMethodSwizzle(Class c, SEL originalSelector) {
    NSString *selectorString = NSStringFromSelector(originalSelector);
    SEL newSelector = NSSelectorFromString([@"swizzled_" stringByAppendingString:selectorString]);
    SEL noopSelector = NSSelectorFromString([@"noop_" stringByAppendingString:selectorString]);
    Method originalMethod, newMethod, noop;
    originalMethod = class_getInstanceMethod(c, originalSelector);
    newMethod = class_getInstanceMethod(c, newSelector);
    noop = class_getInstanceMethod(c, noopSelector);
    if (class_addMethod(c, originalSelector, method_getImplementation(newMethod), method_getTypeEncoding(newMethod))) {
        class_replaceMethod(c, newSelector, method_getImplementation(originalMethod) ?: method_getImplementation(noop), method_getTypeEncoding(originalMethod));
    } else {
        method_exchangeImplementations(originalMethod, newMethod);
    }
}

+ (void)load
{
    FBMethodSwizzle([self class], @selector(application:openURL:sourceApplication:annotation:));
}

- (void)noop_application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
}

- (void)swizzled_application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
    if (!url) {
        return;
    }
    // Required by FBSDKCoreKit for deep linking/to complete login
    [[FBSDKApplicationDelegate sharedInstance] application:application openURL:url sourceApplication:sourceApplication annotation:annotation];

    // Call existing method
    [self swizzled_application:application openURL:url sourceApplication:sourceApplication annotation:annotation];

    // NOTE: Cordova will run a JavaScript method here named handleOpenURL. This functionality is deprecated
    // but will cause you to see JavaScript errors if you do not have window.handleOpenURL defined:
    // https://github.com/Wizcorp/phonegap-facebook-plugin/issues/703#issuecomment-63748816
    NSLog(@"FB handle url: %@", url);
}

@end
