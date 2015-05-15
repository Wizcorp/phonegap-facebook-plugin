//
//  FacebookConnectPlugin.h
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Updated by Ally Ogilvie on 29/Jan/2014.
//  Updated by Brant Watrous on 15-05-11.
//  Copyright 2011 Nitobi. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>
#import <FBSDKShareKit/FBSDKShareKit.h>
#import <Cordova/CDV.h>

@interface FacebookConnectPlugin : CDVPlugin <FBSDKSharingDelegate,
                                              FBSDKAppInviteDialogDelegate,
                                              FBSDKGameRequestDialogDelegate,
                                              FBSDKAppGroupJoinDialogDelegate>
@end
