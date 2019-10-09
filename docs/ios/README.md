# Facebook Requirements and Set-Up [iOS]

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an `APP_ID` [https://developers.facebook.com/apps](https://developers.facebook.com/apps).

If you plan on rolling this out on iOS, please note that you will need to ensure that you have properly set up your Native iOS App settings on the [Facebook App Dashboard](http://developers.facebook.com/apps). Please see the [Getting Started with the Facebook SDK](https://developers.facebook.com/docs/ios/getting-started/): Create a Facebook App section, for more details on this.

### Installation

This plugin requires [Cordova CLI](http://cordova.apache.org/docs/en/3.5.0/guide_cli_index.md.html).

To install the plugin in your app, execute the following (replace variables where necessary):

```sh
# Create initial Cordova app
$ cordova create myApp
$ cd myApp/
$ cordova platform add ios

# Remember to replace APP_ID and APP_NAME variables
$ cordova plugin add cordova-plugin-facebook4 --save --variable APP_ID="123456789" --variable APP_NAME="myApplication"
```

### Cocoapods

This plugin use the [CocoaPods dependency manager](https://cocoapods.org) in order to satisfy the iOS Facebook SDK library dependencies.

Therefore please make sure you have Cocoapods installed in your iOS build environment - setup instructions can be found [here](https://cocoapods.org/). Also make sure your local Cocoapods repo is up-to-date by running `pod repo update`.

If building your project in Xcode, you need to open `YourProject.xcworkspace` (not `YourProject.xcodeproj`) so both your Cordova app project and the Pods project will be loaded into Xcode.

You can list the pod dependencies in your Cordova iOS project by installing [cocoapods-dependencies](https://github.com/segiddins/cocoapods-dependencies):

```bash
sudo gem install cocoapods-dependencies
cd platforms/ios/
pod dependencies
 ```

#### Error: pod: Command failed with exit code 31

If you install the plugin and face the error `Failed to install 'cordova-plugin-facebook4': Error: pod: Command failed with exit code 31`, it probably means that your local Pod repo is not up-to-date. In order to solve the problem, prior the installation, run th following command in your platform to update your Pod repo:

```bash
pod update
```

#### 'FBSDKCoreKit/FBSDKCoreKit.h' file not found

If you are using Cordova iOS < v5, you might face the error `'FBSDKCoreKit/FBSDKCoreKit.h' file not found`. To overcome this problem, edit the `plugin.xml` of the plugin in order to fetch de Facebook iOS SDK by adding the following `framework` references:

```
<framework src="FBSDKCoreKit" type="podspec" spec="X.Y.Z" />
<framework src="FBSDKLoginKit" type="podspec" spec="X.Y.Z" />
<framework src="FBSDKShareKit" type="podspec" spec="X.Y.Z" />
```

Replace `X.Y.Z` with the Facebook iOS SDK and remove and add your platform again.
