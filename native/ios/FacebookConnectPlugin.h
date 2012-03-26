//
//  FacebookConnectPlugin.h
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Copyright 2011 Nitobi. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "FBConnect.h"

#ifdef CORDOVA_FRAMEWORK
    #import <Cordova/CDVPlugin.h>
    #import <Cordova/CDVPluginResult.h>
#else
    #import "CDVPlugin.h"
    #import "CDVPluginResult.h"
#endif


@interface FacebookConnectPlugin : CDVPlugin < FBSessionDelegate, FBRequestDelegate, FBDialogDelegate > {
}

@property (nonatomic, retain) Facebook *facebook;
@property (nonatomic, copy) NSString* loginCallbackId;

- (NSDictionary*) responseObject;

@end
