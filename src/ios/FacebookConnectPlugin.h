//
//  FacebookConnectPlugin.h
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Updated by Ally Ogilvie on 29/Jan/2014.
//  Updated by Jeduan Cornejo on 3/Jul/2015
//  Copyright 2011 Nitobi. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>
#import <FBSDKShareKit/FBSDKShareKit.h>
#import <Cordova/CDV.h>
#import "AppDelegate.h"

@interface FacebookConnectPlugin : CDVPlugin <FBSDKSharingDelegate, FBSDKAppInviteDialogDelegate, FBSDKGameRequestDialogDelegate>
- (void)getLoginStatus:(CDVInvokedUrlCommand *)command;
- (void)getAccessToken:(CDVInvokedUrlCommand *)command;
- (void)logEvent:(CDVInvokedUrlCommand *)command;
- (void)logPurchase:(CDVInvokedUrlCommand *)command;
- (void)login:(CDVInvokedUrlCommand *)command;
- (void)logout:(CDVInvokedUrlCommand *)command;
- (void)graphApi:(CDVInvokedUrlCommand *)command;
- (void)showDialog:(CDVInvokedUrlCommand *)command;
- (void)appInvite:(CDVInvokedUrlCommand *) command;
- (void)getDeferredApplink:(CDVInvokedUrlCommand *) command;
- (void)activateApp:(CDVInvokedUrlCommand *)command;
@end
