//
//  FacebookConnectPlugin.m
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Updated by Mathijs de Bruin on 11-08-25.
//  Updated by Christine Abernathy on 13-01-22
//  Updated by Jeduan Cornejo on 15-07-04
//  Updated by Eds Keizer on 16-06-13
//  Copyright 2011 Nitobi, Mathijs de Bruin. All rights reserved.
//

#import "FacebookConnectPlugin.h"
#import <objc/runtime.h>

@interface FacebookConnectPlugin ()

@property (strong, nonatomic) NSString* dialogCallbackId;
@property (strong, nonatomic) FBSDKLoginManager *loginManager;
@property (strong, nonatomic) NSString* gameRequestDialogCallbackId;
@property (nonatomic, assign) BOOL applicationWasActivated;

- (NSDictionary *)responseObject;
- (NSDictionary*)parseURLParams:(NSString *)query;
- (BOOL)isPublishPermission:(NSString*)permission;
- (BOOL)areAllPermissionsReadPermissions:(NSArray*)permissions;
- (void)enableHybridAppEvents;
@end

@implementation FacebookConnectPlugin

- (void)pluginInitialize {
    NSLog(@"Starting Facebook Connect plugin");

    // Add notification listener for tracking app activity with FB Events
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationDidFinishLaunching:)
                                                 name:UIApplicationDidFinishLaunchingNotification object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(applicationDidBecomeActive:)
                                                 name:UIApplicationDidBecomeActiveNotification object:nil];
}

- (void) applicationDidFinishLaunching:(NSNotification *) notification {
    NSDictionary* launchOptions = notification.userInfo;
    if (launchOptions == nil) {
        //launchOptions is nil when not start because of notification or url open
        launchOptions = [NSDictionary dictionary];
    }

    [[FBSDKApplicationDelegate sharedInstance] application:[UIApplication sharedApplication] didFinishLaunchingWithOptions:launchOptions];
}

- (void) applicationDidBecomeActive:(NSNotification *) notification {
    [FBSDKAppEvents activateApp];
    if (self.applicationWasActivated == NO) {
        self.applicationWasActivated = YES;
        [self enableHybridAppEvents];
    }
}

#pragma mark - Cordova commands

- (void)getLoginStatus:(CDVInvokedUrlCommand *)command {
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                  messageAsDictionary:[self responseObject]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)getAccessToken:(CDVInvokedUrlCommand *)command {
    // Return access token if available
    CDVPluginResult *pluginResult;
    // Check if the session is open or not
    if ([FBSDKAccessToken currentAccessToken]) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:
                        [FBSDKAccessToken currentAccessToken].tokenString];
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
            [FBSDKAppEvents logEvent:eventName];

        } else {
            // argument count is not 0 or 1, must be 2 or more
            params = [command.arguments objectAtIndex:1];
            if ([command.arguments count] == 2) {
                // If count is 2 we will just send params
                [FBSDKAppEvents logEvent:eventName parameters:params];
            }

            if ([command.arguments count] >= 3) {
                // If count is 3 we will send params and a value to sum
                value = [[command.arguments objectAtIndex:2] doubleValue];
                [FBSDKAppEvents logEvent:eventName valueToSum:value parameters:params];
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
    [FBSDKAppEvents logPurchase:value currency:currency];

    res = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:res callbackId:command.callbackId];
}

- (void)login:(CDVInvokedUrlCommand *)command {
    NSLog(@"Starting login");
    CDVPluginResult *pluginResult;
    NSArray *permissions = nil;

    if ([command.arguments count] > 0) {
        permissions = command.arguments;
    }

    // this will prevent from being unable to login after updating plugin or changing permissions
    // without refreshing there will be a cache problem. This simple call should fix the problems
    [FBSDKAccessToken refreshCurrentAccessToken:nil];

    FBSDKLoginManagerLoginResultBlock loginHandler = ^void(FBSDKLoginManagerLoginResult *result, NSError *error) {
        if (error) {
            // If the SDK has a message for the user, surface it.
            NSString *errorMessage = error.userInfo[FBSDKErrorLocalizedDescriptionKey] ?: @"There was a problem logging you in.";
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                              messageAsString:errorMessage];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            return;
        } else if (result.isCancelled) {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                              messageAsString:@"User cancelled."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                          messageAsDictionary:[self responseObject]];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
    };

    // Check if the session is open or not
    if ([FBSDKAccessToken currentAccessToken] == nil) {
        // Initial log in, can only ask to read
        // type permissions
        if (permissions == nil) {
            permissions = @[];
        }
        if (! [self areAllPermissionsReadPermissions:permissions]) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                             messageAsString:@"You can only ask for read permissions initially"];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            return;
        }

        if (self.loginManager == nil) {
            self.loginManager = [[FBSDKLoginManager alloc] init];
        }
        [self.loginManager logInWithPermissions:permissions fromViewController:[self topMostController] handler:loginHandler];
        return;
    }


    if (permissions == nil) {
        // We need permissions
        NSString *permissionsErrorMessage = @"No permissions specified at login";
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                         messageAsString:permissionsErrorMessage];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
    }

    [self loginWithPermissions:permissions withHandler:loginHandler];

}

- (void) checkHasCorrectPermissions:(CDVInvokedUrlCommand*)command
{

    NSArray *permissions = nil;

    if ([command.arguments count] > 0) {
        permissions = command.arguments;
    }
    
    NSSet *grantedPermissions = [FBSDKAccessToken currentAccessToken].permissions; 

    for (NSString *value in permissions) {
    	NSLog(@"Checking permission %@.", value);
        if (![grantedPermissions containsObject:value]) { //checks if permissions does not exists
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
            												 messageAsString:@"A permission has been denied"];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            return;
        }
    }
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
    												 messageAsString:@"All permissions have been accepted"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    return;
}

- (void) logout:(CDVInvokedUrlCommand*)command
{
    if ([FBSDKAccessToken currentAccessToken]) {
        // Close the session and clear the cache
        if (self.loginManager == nil) {
            self.loginManager = [[FBSDKLoginManager alloc] init];
        }

        [self.loginManager logOut];
    }

    // Else just return OK we are already logged out
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) showDialog:(CDVInvokedUrlCommand*)command
{
    if ([command.arguments count] == 0) {
        CDVPluginResult *pluginResult;
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                         messageAsString:@"No method provided"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
    }

    NSMutableDictionary *options = [[command.arguments lastObject] mutableCopy];
    NSString* method = options[@"method"];
    if (!method) {
        CDVPluginResult *pluginResult;
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                         messageAsString:@"No method provided"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
    }

    [options removeObjectForKey:@"method"];
    NSDictionary *params = [options copy];

    // Check method
    if ([method isEqualToString:@"send"]) {
        // Send private message dialog
        // Create native params
        FBSDKShareLinkContent *content = [[FBSDKShareLinkContent alloc] init];
        content.contentURL = [NSURL URLWithString:[params objectForKey:@"link"]];

        self.dialogCallbackId = command.callbackId;
        [FBSDKMessageDialog showWithContent:content delegate:self];
        return;

    } else if ([method isEqualToString:@"share"] || [method isEqualToString:@"feed"]) {
        // Create native params
        FBSDKShareLinkContent *content = [[FBSDKShareLinkContent alloc] init];
        content.contentURL = [NSURL URLWithString:params[@"href"]];
        content.hashtag = [FBSDKHashtag hashtagWithString:[params objectForKey:@"hashtag"]];
        content.quote = params[@"quote"];

        self.dialogCallbackId = command.callbackId;
        FBSDKShareDialog *dialog = [[FBSDKShareDialog alloc] init];
        dialog.fromViewController = [self topMostController];
        dialog.shareContent = content;
        dialog.delegate = self;
        // Adopt native share sheets with the following line
        if (params[@"share_sheet"]) {
        	dialog.mode = FBSDKShareDialogModeShareSheet;
        } else if (params[@"share_feedBrowser"]) {
        	dialog.mode = FBSDKShareDialogModeFeedBrowser;
        } else if (params[@"share_native"]) {
        	dialog.mode = FBSDKShareDialogModeNative;
        } else if (params[@"share_feedWeb"]) {
        	dialog.mode = FBSDKShareDialogModeFeedWeb;
        }

        [dialog show];
        return;
    }
    else if ( [method isEqualToString:@"share_open_graph"] ) {
        if(!params[@"action"] || !params[@"object"]) {
            NSLog(@"No action or object defined");
            return;
        }

        //Get object JSON
        NSError *jsonError;
        NSData *objectData = [params[@"object"] dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *json = [NSJSONSerialization JSONObjectWithData:objectData
                                                             options:NSJSONReadingMutableContainers
                                                               error:&jsonError];

        if(jsonError) {
            NSLog(@"There was an error parsing your 'object' JSON string");
        } else {
            FBSDKShareOpenGraphObject *object = [FBSDKShareOpenGraphObject objectWithProperties:json];
            if(!json[@"og:type"]) {
                NSLog(@"No 'og:type' encountered in the object JSON. Please provide an Open Graph object type.");
                return;
            }
            NSString *objectType = json[@"og:type"];
            objectType = [objectType stringByReplacingOccurrencesOfString:@"."
                                                               withString:@":"];
            FBSDKShareOpenGraphAction *action = [FBSDKShareOpenGraphAction actionWithType:params[@"action"] object:object key:objectType];

            FBSDKShareOpenGraphContent *content = [[FBSDKShareOpenGraphContent alloc] init];
            content.action = action;
            content.previewPropertyName = objectType;
            [FBSDKShareDialog showFromViewController:self.topMostController
                                         withContent:content
                                            delegate:nil];
        }
        return;
    }
    else if ([method isEqualToString:@"apprequests"]) {
        FBSDKGameRequestDialog *dialog = [[FBSDKGameRequestDialog alloc] init];
        dialog.delegate = self;
        if (![dialog canShow]) {
            CDVPluginResult *pluginResult;
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                            messageAsString:@"Cannot show dialog"];
            return;
        }

        FBSDKGameRequestContent *content = [[FBSDKGameRequestContent alloc] init];
        NSString *actionType = params[@"actionType"];
        if (!actionType) {
            CDVPluginResult *pluginResult;
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                             messageAsString:@"Cannot show dialog"];
            return;
        }
        if ([[actionType lowercaseString] isEqualToString:@"askfor"]) {
            content.actionType = FBSDKGameRequestActionTypeAskFor;
        } else if ([[actionType lowercaseString] isEqualToString:@"send"]) {
            content.actionType = FBSDKGameRequestActionTypeSend;
        } else if ([[actionType lowercaseString] isEqualToString:@"turn"]) {
            content.actionType = FBSDKGameRequestActionTypeTurn;
        }

        NSString *filters = params[@"filters"];
        if (!filters) {
            content.filters = FBSDKGameRequestFilterNone;
        } else if ([filters isEqualToString:@"app_users"]) {
            content.filters = FBSDKGameRequestFilterAppUsers;
        } else if ([filters isEqualToString:@"app_non_users"]) {
            content.filters = FBSDKGameRequestFilterAppNonUsers;
        }

        content.data = params[@"data"];
        content.message = params[@"message"];
        content.objectID = params[@"objectID"];
        content.recipients = params[@"to"];
        content.title = params[@"title"];

        self.gameRequestDialogCallbackId = command.callbackId;
        dialog.content = content;
        [dialog show];
        return;
    }
    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"method not supported"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) graphApi:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult *pluginResult;
    if (! [FBSDKAccessToken currentAccessToken]) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                          messageAsString:@"You are not logged in."];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }

    NSString *graphPath = [command argumentAtIndex:0];
    NSArray *permissionsNeeded = [command argumentAtIndex:1];
    NSSet *currentPermissions = [FBSDKAccessToken currentAccessToken].permissions;

    // We will store here the missing permissions that we will have to request
    NSMutableArray *requestPermissions = [[NSMutableArray alloc] initWithArray:@[]];
    NSArray *permissions;

    // Check if all the permissions we need are present in the user's current permissions
    // If they are not present add them to the permissions to be requested
    for (NSString *permission in permissionsNeeded){
        if (![currentPermissions containsObject:permission]) {
            [requestPermissions addObject:permission];
        }
    }
    permissions = [requestPermissions copy];

    // Defines block that handles the Graph API response
    FBSDKGraphRequestBlock graphHandler = ^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
        CDVPluginResult* pluginResult;
        if (error) {
            NSString *message = error.userInfo[FBSDKErrorLocalizedDescriptionKey] ?: @"There was an error making the graph call.";
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                             messageAsString:message];
        } else {
            NSDictionary *response = (NSDictionary *) result;
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:response];
        }
        NSLog(@"Finished GraphAPI request");

        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    };

    NSLog(@"Graph Path = %@", graphPath);
    FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:graphPath];

    // If we have permissions to request
    if ([permissions count] == 0){
        [request startWithCompletionHandler:graphHandler];
        return;
    }

    [self loginWithPermissions:requestPermissions withHandler:^(FBSDKLoginManagerLoginResult *result, NSError *error) {
        if (error) {
            // If the SDK has a message for the user, surface it.
            NSString *errorMessage = error.userInfo[FBSDKErrorLocalizedDescriptionKey] ?: @"There was a problem logging you in.";
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                              messageAsString:errorMessage];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            return;
        } else if (result.isCancelled) {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                              messageAsString:@"User cancelled."];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            return;
        }

        NSString *deniedPermission = nil;
        for (NSString *permission in permissions) {
            if (![result.grantedPermissions containsObject:permission]) {
                deniedPermission = permission;
                break;
            }
        }

        if (deniedPermission != nil) {
            NSString *errorMessage = [NSString stringWithFormat:@"The user didnt allow necessary permission %@", deniedPermission];
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                              messageAsString:errorMessage];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            return;
        }

        [request startWithCompletionHandler:graphHandler];
    }];
}

- (void) getDeferredApplink:(CDVInvokedUrlCommand *) command
{
    [FBSDKAppLinkUtility fetchDeferredAppLink:^(NSURL *url, NSError *error) {
        if (error) {
            // If the SDK has a message for the user, surface it.
            NSString *errorMessage = error.userInfo[FBSDKErrorLocalizedDescriptionKey] ?: @"Received error while fetching deferred app link.";
            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                              messageAsString:errorMessage];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            return;
        }
        if (url) {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString: url.absoluteString];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        } else {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
    }];
}

- (void) activateApp:(CDVInvokedUrlCommand *)command
{
    [FBSDKAppEvents activateApp];
}

#pragma mark - Utility methods

- (void) loginWithPermissions:(NSArray *)permissions withHandler:(FBSDKLoginManagerLoginResultBlock) handler {
    BOOL publishPermissionFound = NO;
    BOOL readPermissionFound = NO;
    if (self.loginManager == nil) {
        self.loginManager = [[FBSDKLoginManager alloc] init];
    }

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
        NSDictionary *userInfo = @{
            FBSDKErrorLocalizedDescriptionKey: @"Cannot ask for both read and publish permissions.",
        };
        NSError *error = [NSError errorWithDomain:@"facebook" code:-1 userInfo:userInfo];
        handler(nil, error);
    } else {
        [self.loginManager logInWithPermissions:permissions fromViewController:[self topMostController] handler:handler];
    }
}

- (UIViewController*) topMostController {
    UIViewController *topController = [UIApplication sharedApplication].keyWindow.rootViewController;

    while (topController.presentedViewController) {
        topController = topController.presentedViewController;
    }

    return topController;
}

- (NSDictionary *)responseObject {

    if (![FBSDKAccessToken currentAccessToken]) {
        return @{@"status": @"unknown"};
    }

    NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
    FBSDKAccessToken *token = [FBSDKAccessToken currentAccessToken];

    NSTimeInterval expiresTimeInterval = token.expirationDate.timeIntervalSinceNow;
    NSString *expiresIn = @"0";
    if (expiresTimeInterval > 0) {
        expiresIn = [NSString stringWithFormat:@"%0.0f", expiresTimeInterval];
    }


    response[@"status"] = @"connected";
    response[@"authResponse"] = @{
                                  @"accessToken" : token.tokenString ? token.tokenString : @"",
                                  @"expiresIn" : expiresIn,
                                  @"secret" : @"...",
                                  @"session_key" : [NSNumber numberWithBool:YES],
                                  @"sig" : @"...",
                                  @"userID" : token.userID ? token.userID : @""
                                  };


    return [response copy];
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

#if __IPHONE_OS_VERSION_MAX_ALLOWED < __IPHONE_9_0
         NSString *key = [kv[0] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
         NSString *val = [kv[1] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
#else
         NSString *key = [kv[0] stringByRemovingPercentEncoding];
         NSString *val = [kv[1] stringByRemovingPercentEncoding];
#endif

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

/*
 * Enable the hybrid app events for the webview.
 * This feature only works with WKWebView so until
 * Cordova iOS 5 is relased
 * (https://cordova.apache.org/news/2018/08/01/future-cordova-ios-webview.html),
 * an additional plugin (e.g cordova-plugin-wkwebview-engine) is needed.
 */
- (void)enableHybridAppEvents {
    if ([self.webView isMemberOfClass:[WKWebView class]]){
        NSString *is_enabled = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"FacebookHybridAppEvents"];
        if([is_enabled isEqualToString:@"true"]){
            [FBSDKAppEvents augmentHybridWKWebView:(WKWebView*)self.webView];
            NSLog(@"FB Hybrid app events are enabled");
        } else {
            NSLog(@"FB Hybrid app events are not enabled");
        }
    } else {
        NSLog(@"FB Hybrid app events cannot be enabled, this feature requires WKWebView");
    }
}

# pragma mark - FBSDKSharingDelegate

- (void)sharer:(id<FBSDKSharing>)sharer didCompleteWithResults:(NSDictionary *)results {
    if (!self.dialogCallbackId) {
        return;
    }

    CDVPluginResult *pluginResult;
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                 messageAsDictionary:results];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.dialogCallbackId];
    self.dialogCallbackId = nil;
}

- (void)sharer:(id<FBSDKSharing>)sharer didFailWithError:(NSError *)error {
    if (!self.dialogCallbackId) {
        return;
    }

    CDVPluginResult *pluginResult;
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                     messageAsString:[NSString stringWithFormat:@"Error: %@", error.description]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.dialogCallbackId];
    self.dialogCallbackId = nil;
}

- (void)sharerDidCancel:(id<FBSDKSharing>)sharer {
    if (!self.dialogCallbackId) {
        return;
    }

    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                      messageAsString:@"User cancelled."];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.dialogCallbackId];
    self.dialogCallbackId = nil;
}


#pragma mark - FBSDKGameRequestDialogDelegate

- (void)gameRequestDialog:(FBSDKGameRequestDialog *)gameRequestDialog
   didCompleteWithResults:(NSDictionary *)results
{
    if (!self.gameRequestDialogCallbackId) {
        return;
    }

    NSLog(@"game request dialog did complete");
    NSLog(@"result::%@", results);

    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:results];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.gameRequestDialogCallbackId];
    self.gameRequestDialogCallbackId = nil;
}

- (void)gameRequestDialogDidCancel:(FBSDKGameRequestDialog *)gameRequestDialog
{
    if (!self.gameRequestDialogCallbackId) {
        return;
    }

    NSLog(@"game request dialog did cancel");

    CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"User cancelled dialog"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.gameRequestDialogCallbackId];
    self.gameRequestDialogCallbackId = nil;
}

- (void)gameRequestDialog:(FBSDKGameRequestDialog *)gameRequestDialog
         didFailWithError:(NSError *)error
{
    if (!self.gameRequestDialogCallbackId) {
        return;
    }

    NSLog(@"game request dialog did fail");
    NSLog(@"error::%@", error);

    CDVPluginResult* pluginResult;
    NSString *message = error.userInfo[FBSDKErrorLocalizedDescriptionKey] ?: @"There was an error making the graph call.";
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                     messageAsString:message];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.gameRequestDialogCallbackId];
    self.gameRequestDialogCallbackId = nil;
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
    FBMethodSwizzle([self class], @selector(application:openURL:options:));
}

// This method is a duplicate of the other openURL method below, except using the newer iOS (9) API.
- (BOOL)swizzled_application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<NSString *,id> *)options {
    if (!url) {
        return NO;
    }
    // Required by FBSDKCoreKit for deep linking/to complete login
    [[FBSDKApplicationDelegate sharedInstance] application:application openURL:url sourceApplication:[options valueForKey:@"UIApplicationOpenURLOptionsSourceApplicationKey"] annotation:0x0];
    
    // NOTE: Cordova will run a JavaScript method here named handleOpenURL. This functionality is deprecated
    // but will cause you to see JavaScript errors if you do not have window.handleOpenURL defined:
    // https://github.com/Wizcorp/phonegap-facebook-plugin/issues/703#issuecomment-63748816
    NSLog(@"FB handle url using application:openURL:options: %@", url);

    // Call existing method
    return [self swizzled_application:application openURL:url options:options];
}

- (BOOL)noop_application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
    return NO;
}

- (BOOL)swizzled_application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
    if (!url) {
        return NO;
    }
    // Required by FBSDKCoreKit for deep linking/to complete login
    [[FBSDKApplicationDelegate sharedInstance] application:application openURL:url sourceApplication:sourceApplication annotation:annotation];

    // NOTE: Cordova will run a JavaScript method here named handleOpenURL. This functionality is deprecated
    // but will cause you to see JavaScript errors if you do not have window.handleOpenURL defined:
    // https://github.com/Wizcorp/phonegap-facebook-plugin/issues/703#issuecomment-63748816
    NSLog(@"FB handle url using application:openURL:sourceApplication:annotation: %@", url);
    
    // Call existing method
    return [self swizzled_application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
}
@end
