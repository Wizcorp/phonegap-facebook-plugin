# Facebook Requirements and Set-Up [iOS]

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an `APP_ID` [https://developers.facebook.com/apps](https://developers.facebook.com/apps).

If you plan on rolling this out on iOS, please note that you will need to ensure that you have properly set up your Native iOS App settings on the [Facebook App Dashboard](http://developers.facebook.com/apps). Please see the [Getting Started with the Facebook SDK](https://developers.facebook.com/docs/ios/getting-started/): Create a Facebook App section, for more details on this.

## Example Apps

`platforms/android` and `platforms/ios` contain example projects and all the native code for the plugin for both Android and iOS platforms. They also include versions of the Android and iOS Facebook SDKs. These are used during automatic installation.

## Install

This plugin requires [Cordova CLI](http://cordova.apache.org/docs/en/3.5.0/guide_cli_index.md.html).

To install the plugin in your app, execute the following (replace variables where necessary)...


	cordova create myApp

	cd myApp/

	cordova platform add ios

	cordova -d plugin add /Users/your/path/here/phonegap-facebook-plugin --variable APP_ID="123456789" --variable APP_NAME="myApplication"

## Setup

- Change **FacebookAppID** in project *-info.plist
- Change URL scheme to `fb<YOUR APPID>` e.g. `fb123456789`