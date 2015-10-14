//
//  AppDelegate+OverrideOpenURL.m
//  AppDelegate changes for iOS9, according with 
//  https://developers.facebook.com/docs/ios/upgrading-4.x
//
//  Created by Isac Araujo on 10/14/15.
//  Copyright 2015 Ever Ag, Will Soares. All rights reserved.
//

#import "AppDelegate.h"

@interface AppDelegate (OverrideOpenURL)

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation;

@end
