# Facebook Requirements and Set-Up [Android]

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an APP_ID (https://developers.facebook.com/apps).

If you plan on rolling this out on Android, please note that you will need to [generate a hash of your Android key(s) and submit those to the Developers page on Facebook](https://developers.facebook.com/docs/android/getting-started/facebook-sdk-for-android/) to get it working. Furthermore, if you are generating this hash on Windows (specifically 64 bit versions), please use version 0.9.8e or 0.9.8d of [OpenSSL for Windows](http://code.google.com/p/openssl-for-windows/downloads/list) and *not* 0.9.8k. Big ups to [fernandomatos](http://github.com/fernandomatos) for pointing this out!

## Example Apps

`platforms/android` and `platforms/ios` contain example projects and all the native code for the plugin for both Android and iOS platforms. They also include versions of the Android and iOS Facebook SDKs. These are used during automatic installation.

For Android sample app remember to configure the project with your FB app id in the `res/values/facebookconnect.xml` file. For example:

	<resources>
    	<string name="fb_app_id">123456789</string>
    	<string name="fb_app_name">TEST</string>
	</resources>

## Install

This plugin requires [Cordova CLI](http://cordova.apache.org/docs/en/3.5.0/guide_cli_index.md.html).

To install the plugin in your app, execute the following (replace variables where necessary):
```sh
# Create initial Cordova app
$ cordova create myApp
$ cd myApp/
$ cordova platform add android

# Remember to replace APP_ID and APP_NAME variables
$ cordova -d plugin add /path/to/cloned/phonegap-facebook-plugin --variable APP_ID="123456789" --variable APP_NAME="myApplication"
```

You can now use the plugin right away

## Setup with Eclipse (Removed)

** You no longer need the additional Eclipse steps.  A custom_rules.xml file was added for configuring ANT properly.