//
//  FacebookConnectPlugin.h
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Copyright 2011 Nitobi. All rights reserved.
//

#import <Foundation/Foundation.h>
#ifdef PHONEGAP_FRAMEWORK
    #import <PhoneGap/PGPlugin.h>
#else
    #import "PGPlugin.h"
#endif
#import "FBConnect.h"


@interface FacebookConnectPlugin : PGPlugin<FBSessionDelegate,FBRequestDelegate,FBDialogDelegate> {
}

@property (nonatomic, retain) Facebook *facebook;


@end
