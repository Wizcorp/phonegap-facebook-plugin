//
//  FacebookWrapperSingleton
//  GapFacebookConnect
//
//  Created by Rafael Almeida - AppGyver.com
//

#import <Foundation/Foundation.h>
#import <FacebookSDK/FacebookSDK.h>
#import <Cordova/CDV.h>

@interface FacebookWrapperSingleton : CDVPlugin

+(FacebookWrapperSingleton*) instance;

- (NSDictionary *)getStatusDictionary;

-(BOOL) isSessionOpen;

-(void)requestNewPublishPermissions:(NSArray*)permissions defaultAudience:(FBSessionDefaultAudience)defaultAudience;

-(void)requestNewReadPermissions:(NSArray*)permissions;

-(void)requestNewReadPermissions:(NSArray*)permissions withBlock:(FBSessionRequestPermissionResultHandler)handler;

-(void)openActiveSessionWithReadPermissions:(NSArray*)permissions allowLoginUI:(BOOL)allowLoginUI;

-(void) logout;

@end
