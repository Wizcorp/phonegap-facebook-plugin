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

Installing this plugin directly from the NPM Cordova Registry currently breaks the symlinks in `FacebookSDK.framework` [CB-6092](https://issues.apache.org/jira/browse/CB-6092). Easiest solution for is to add this plugin from its github url :
```
<plugin name="phonegap-facebook-plugin" spec="https://github.com/Wizcorp/phonegap-facebook-plugin.git">
    <variable name="APP_ID" value="<YOUR APPID>" />
    <variable name="APP_NAME" value="<YOUR APPNAME>" />
</plugin>
```

To install the plugin in your app, execute the following (replace variables where necessary):
```sh
# Create initial Cordova app
$ cordova create myApp
$ cd myApp/
$ cordova platform add ios

# Remember to replace APP_ID and APP_NAME variables
# In order to target a specific version, the release tag can be concatenated to the github url
# For instance : https://github.com/Wizcorp/phonegap-facebook-plugin.git#v0.12.0
$ cordova -d plugin add https://github.com/Wizcorp/phonegap-facebook-plugin.git --variable APP_ID="123456789" --variable APP_NAME="myApplication"
```
