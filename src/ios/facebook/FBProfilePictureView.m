/*
 * Copyright 2010 Facebook
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "FBProfilePictureView.h"
#import "FBURLConnection.h"
#import "FBRequest.h"
#import "FBUtility.h"
#import "FBSDKVersion.h"

@interface FBProfilePictureView()

@property (readonly, nonatomic) NSString *imageQueryParamString;
@property (retain, nonatomic) NSString *previousImageQueryParamString;

@property (retain, nonatomic) FBURLConnection *connection;
@property (retain, nonatomic) UIImageView *imageView;

- (void)initialize;
- (void)refreshImage:(BOOL)forceRefresh;
- (void)ensureImageViewContentMode;

@end

@implementation FBProfilePictureView

@synthesize profileID = _profileID;
@synthesize pictureCropping = _pictureCropping;
@synthesize connection = _connection;
@synthesize imageView = _imageView;
@synthesize previousImageQueryParamString = _previousImageQueryParamString;

#pragma mark - Lifecycle

- (void)dealloc {
    [_profileID release];
    [_imageView release];
    [_connection release];
    [_previousImageQueryParamString release];
    
    [super dealloc];
}

- (id)init {
    self = [super init];
    if (self) {
        [self initialize];
    }
    
    return self;
}

- (id)initWithProfileID:(NSString *)profileID 
        pictureCropping:(FBProfilePictureCropping)pictureCropping {
    self = [self init];
    if (self) {
        self.pictureCropping = pictureCropping;
        self.profileID = profileID;
    }
    
    return self;
}

- (id)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        [self initialize];
    }
    
    return self;
}

- (id)initWithCoder:(NSCoder *)aDecoder {
    self = [super initWithCoder:aDecoder];
    if (self) {
        [self initialize];
    }
    return self;
}

#pragma mark -

- (NSString *)imageQueryParamString  {
    
    static CGFloat screenScaleFactor = 0.0;
    if (screenScaleFactor == 0.0) {
        screenScaleFactor = [[UIScreen mainScreen] scale];
    }
    
    // Retina display doesn't increase the bounds that iOS returns.  The larger size to fetch needs
    // to be calculated using the scale factor accessed above.
    int width = (int)(self.bounds.size.width * screenScaleFactor);

    if (self.pictureCropping == FBProfilePictureCroppingSquare) {
        return [NSString stringWithFormat:@"width=%d&height=%d&migration_bundle=%@", 
                width, 
                width, 
                FB_IOS_SDK_MIGRATION_BUNDLE];
    } 
    
    // For non-square images, we choose between three variants knowing that the small profile picture is 
    // 50 pixels wide, normal is 100, and large is about 200.
    if (width <= 50) {
        return @"type=small";
    } else if (width <= 100) {
        return @"type=normal";
    } else {
        return @"type=large";
    }
}

- (void)initialize {    
    // the base class can cause virtual recursion, so
    // to handle this we make initialize idempotent
    if (self.imageView) {
        return;
    }
    
    UIImageView* imageView = [[[UIImageView alloc] initWithFrame:self.bounds] autorelease];
    imageView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    self.imageView = imageView;

    self.autoresizesSubviews = YES;
    self.clipsToBounds = YES;
        
    [self addSubview:self.imageView];
}

- (void)refreshImage:(BOOL)forceRefresh  {
    NSString *newImageQueryParamString = self.imageQueryParamString;
    
    // If not forcing refresh, check to see if the previous size we used would be the same
    // as what we'd request now, as this method could be called often on control bounds animation,
    // and we only want to fetch when needed.
    if (!forceRefresh && [self.previousImageQueryParamString isEqualToString:newImageQueryParamString]) {
        
        // But we still may need to adjust the contentMode.
        [self ensureImageViewContentMode];
        return;
    }      
    
    if (self.profileID) {
        
        [self.connection cancel];

        FBURLConnectionHandler handler = 
            ^(FBURLConnection *connection, NSError *error, NSURLResponse *response, NSData *data) {
                FBConditionalLog(self.connection == connection, @"Inconsistent connection state");

                self.connection = nil;
                if (!error) {
                    self.imageView.image = [UIImage imageWithData:data];
                    [self ensureImageViewContentMode];
                }
            };
                
        NSString *template = @"%@/%@/picture?%@";     
        NSString *urlString = [NSString stringWithFormat:template, 
                               FBGraphBasePath,
                               self.profileID, 
                               newImageQueryParamString];
        NSURL *url = [NSURL URLWithString:urlString];
        
        self.connection = [[[FBURLConnection alloc] initWithURL:url
                                              completionHandler:handler]
                           autorelease];
    } else {
        BOOL isSquare = (self.pictureCropping == FBProfilePictureCroppingSquare);

        NSString *blankImageName = 
            [NSString 
                stringWithFormat:@"FacebookSDKResources.bundle/FBProfilePictureView/images/fb_blank_profile_%@.png",
                isSquare ? @"square" : @"portrait"];

        self.imageView.image = [UIImage imageNamed:blankImageName];
        [self ensureImageViewContentMode];
    }
    
    self.previousImageQueryParamString = newImageQueryParamString;
}

- (void)ensureImageViewContentMode {
    // Set the image's contentMode such that if the image is larger than the control, we scale it down, preserving aspect 
    // ratio.  Otherwise, we center it.  This ensures that we never scale up, and pixellate, the image.
    CGSize viewSize = self.bounds.size;
    CGSize imageSize = self.imageView.image.size;
    UIViewContentMode contentMode;

    // If both of the view dimensions are larger than the image, we'll center the image to prevent scaling up.
    // Note that unlike in choosing the image size, we *don't* use any Retina-display scaling factor to choose centering
    // vs. filling.  If we were to do so, we'd get profile pics shrinking to fill the the view on non-Retina, but getting
    // centered and clipped on Retina.  
    if (viewSize.width > imageSize.width && viewSize.height > imageSize.height) {
        contentMode = UIViewContentModeCenter;
    } else {
        contentMode = UIViewContentModeScaleAspectFit;
    }
    
    self.imageView.contentMode = contentMode;
}

- (void)setProfileID:(NSString*)profileID {
    if (!_profileID || ![_profileID isEqualToString:profileID]) {
        [_profileID release];
        _profileID = [profileID copy];
        [self refreshImage:YES];
    }
}

- (void)setPictureCropping:(FBProfilePictureCropping)pictureCropping  {
    if (_pictureCropping != pictureCropping) {
        _pictureCropping = pictureCropping;
        [self refreshImage:YES];
    }
}

// Lets us catch resizes of the control, or any outer layout, allowing us to potentially
// choose a different image.
- (void)layoutSubviews {
    [self refreshImage:NO];
    [super layoutSubviews];   
}


@end
