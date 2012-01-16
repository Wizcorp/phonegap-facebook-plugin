//
//  FacebookConnectPlugin.h
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Copyright 2011 Nitobi. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "FBConnect.h"

#ifdef PHONEGAP_FRAMEWORK
    #import <PhoneGap/PGPlugin.h>
    #import <PhoneGap/PluginResult.h>
#else
    #import "PGPlugin.h"
    #import "PluginResult.h"
#endif


@interface FacebookConnectPlugin : PGPlugin < FBSessionDelegate, FBRequestDelegate, FBDialogDelegate > {
}

@property (nonatomic, retain) Facebook *facebook;
@property (nonatomic, copy) NSString* loginCallbackId;

- (NSDictionary*) responseObject;

@end
