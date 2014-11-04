# Facebook Requirements and Set-Up [iOS]

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an `APP_ID` [https://developers.facebook.com/apps](https://developers.facebook.com/apps).

If you plan on rolling this out on iOS, please note that you will need to ensure that you have properly set up your Native iOS App settings on the [Facebook App Dashboard](http://developers.facebook.com/apps). Please see the [Getting Started with the Facebook SDK](https://developers.facebook.com/docs/ios/getting-started/): Create a Facebook App section, for more details on this.

## Example Apps

`platforms/android` and `platforms/ios` contain example projects and all the native code for the plugin for both Android and iOS platforms. They also include versions of the Android and iOS Facebook SDKs. These are used during automatic installation.

#### Example Setup

Currently these are set as defaults, so please change:

- Change **FacebookAppID** in project *-info.plist
- Change URL scheme to `fb<YOUR APPID>` e.g. `fb123456789`

### Install

This plugin requires [Cordova CLI](http://cordova.apache.org/docs/en/3.5.0/guide_cli_index.md.html).

Installing this plugin directly from Cordova Registry currently breaks the symlinks in `FacebookSDK.framework` [CB-6092](https://issues.apache.org/jira/browse/CB-6092). Easiest solution for now is to just `git clone` this project and install it with *Cordova CLI* using the local clone.
```sh
$ git clone https://github.com/Wizcorp/phonegap-facebook-plugin.git
```

To install the plugin in your app, execute the following (replace variables where necessary):
```sh
# Create initial Cordova app
$ cordova create myApp
$ cd myApp/
$ cordova platform add ios

# The path you cloned the plugin to earlier
# Remember to replace APP_ID and APP_NAME variables
$ cordova -d plugin add /path/to/cloned/phonegap-facebook-plugin --variable APP_ID="123456789" --variable APP_NAME="myApplication"
```
