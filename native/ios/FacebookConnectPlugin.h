//
//  FacebookConnectPlugin.h
//  GapFacebookConnect
//
//  Created by Jesse MacFadyen on 11-04-22.
//  Copyright 2011 Nitobi. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "PhoneGapCommand.h"
#import "FBConnect.h"


@interface FacebookConnectPlugin : PhoneGapCommand<FBSessionDelegate,FBRequestDelegate,FBDialogDelegate> {

	Facebook *facebook;
}

@property (nonatomic, retain) Facebook *facebook;


@end
