# Apache Cordova Facebook Plugin

This is the official plugin for Facebook in Apache Cordova/PhoneGap!

The Facebook plugin for [Apache Cordova](http://incubator.apache.org/cordova/) allows you to use the same JavaScript code in your Cordova application as you use in your web application. However, unlike in the browser, the Cordova application will use the native Facebook app to perform Single Sign On for the user.  If this is not possible then the sign on will degrade gracefully using the standard dialog based authentication.

* Supported on PhoneGap (Cordova) v3.3.0 and above.
* This plugin is build for
	* iOS FacebookSDK 3.13.0
	* Android FacebookSDK 3.8.0

## Facebook Requirements and Set-Up

The Facebook SDK (both native and JavaScript) is changing independent of this plugin. The manual install instructions include how to get the latest SDK for use in your project.

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an APP_ID (https://developers.facebook.com/apps).

If you plan on rolling this out on iOS, please note that you will need to ensure that you have properly set up your Native iOS App settings on the [Facebook App Dashboard](http://developers.facebook.com/apps). Please see the [Getting Started with the Facebook SDK](https://developers.facebook.com/docs/ios/getting-started/): Create a Facebook App section, for more details on this.

If you plan on rolling this out on Android, please note that you will need to [generate a hash of your Android key(s) and submit those to the Developers page on Facebook](https://developers.facebook.com/docs/android/getting-started/facebook-sdk-for-android/) to get it working. Furthermore, if you are generating this hash on Windows (specifically 64 bit versions), please use version 0.9.8e or 0.9.8d of [OpenSSL for Windows](http://code.google.com/p/openssl-for-windows/downloads/list) and *not* 0.9.8k. Big ups to [fernandomatos](http://github.com/fernandomatos) for pointing this out!


`www/phonegap/plugin/facebookConnectPlugin/` contains the JavaScript API file.

`src/android` and `src/ios` contain the native code for the plugin for both Android and iOS platforms. They also include versions of the Android and iOS Facebook SDKs. These are used during automatic installation.

#### NOTICE: The following files are deprecated!

`www/facebook-js-sdk.js` is the modified facebook-js-sdk. It already includes the hooks to work with this plugin.

`www/cdv-plugin-fb-connect.js` is the JavaScript code for the plugin, this defines the JS API.

## Adobe PhoneGap Build

If using this plugin on Adobe PhoneGap Build you can ignore the instructions below and go straight to the 
PhoneGap Build documentation available [here] (https://build.phonegap.com/plugins/257).

## Manual Installation

- None! CLI automatic install is now the recommended method. 
	- Why?
		- Too much can go wrong with this plugin for manual installs.
		- We automate so you have less work to do!
		- All Plugins should be CLI compatible since Cordova 3

## Automatic Installation

This plugin is based on [plugman](https://git-wip-us.apache.org/repos/asf?p=cordova-plugman.git;a=summary).

It will:

 - add native class files
 - setup the whitelist
 - setup URL scheme (for deeplink with FB application if installed)
 - and add your Facebook application Id automagically to a string resource file that can be read from the plugin.

To install the plugin in your app, execute the following (replace variables where necessary)...

### iOS


	cordova create myApp

	cd myApp/

	cordova platform add ios

	cordova -d plugin add /Users/your/path/here/phonegap-facebook-plugin --variable APP_ID="123456789" --variable APP_NAME="myApplication"

### Android

	cordova create myApp

	cd myApp/

	cordova platform add android

	cordova -d plugin add /Users/your/path/here/phonegap-facebook-plugin --variable APP_ID="123456789" --variable APP_NAME="myApplication"
	
**Android requires an additional step which is to reference the FacebookSDK project as a library to your project.**

Open your project in Eclipse (New > Project... Existing Android project from source), import everything (***see Img. 1***).

![image](./android_setup_1.png) ***Img. 1***

In Eclipse, right click your project folder in the left-had column. Select "Properties", select Android in the left column and in the right side of the window add FacebookSDK as a library (***see Img. 2***).

![image](./android_setup_2.png) ***Img. 2***

## JavaScript API

###facebookConnectPlugin.login(Function success, Function failure)

Success function returns an Object like;

	{
		id: "634565435",
		lastName: "bob"
		...
	}
	
Failure function returns an error String.

###facebookConnectPlugin.logout(Function success, Function failure)

###facebookConnectPlugin.getLoginStatus(Function success, Function failure)

Success function returns a status String.

###facebookConnectPlugin.showDialog(Object options, Function success, Function failure)

Example options:

	{
		method: "feed" | "apprequests"
	}
	
Success function returns an Object with `postId` as String.
Failure function returns an error String.

###facebookConnectPlugin.api(String requestPath, Array permissions, Func success, Func failure) 

Allows access to the Facebook Graph API. This API allows for additional permission because, unlike login, the Graph API can accept multiple permissions.

Example permissions:

	["basic_info", "user_birthday"]
	
Success function returns an Object.

Failure function returns an error String.

**Note: "In order to make calls to the Graph API on behalf of a user, the user has to be logged into your app using Facebook login."**

For more information see:

- Calling the Graph API - [https://developers.facebook.com/docs/ios/graph](https://developers.facebook.com/docs/ios/graph)
- Graph Explorer - [https://developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
- Graph API - [https://developers.facebook.com/docs/graph-api/](https://developers.facebook.com/docs/graph-api/)

## Sample JavaScript Code

### Login

In your `onDeviceReady` event add the following

	var fbLoginSuccess = function (userData) {
		alert("UserInfo: " + JSON.stringify(userData));
	}

	facebookConnectPlugin.login(["basic_info"], 
        fbLoginSuccess, 
        function (error) { alert("" + error) }
    );

### Get access token

If you need the Facebook access token (for example, for validating the login on server side), do:

	var fbLoginSuccess = function (userData) {
		alert("UserInfo: " + JSON.stringify(userData));
		facebookConnectPlugin.getAccessToken(function(token) {
			alert("Token: " + token);
		}, function(err) {
			alert("Could not get access token: " + err);
		});
	}

	facebookConnectPlugin.login(["basic_info"], 
        fbLoginSuccess, 
        function (error) { alert("" + error) }
    );
    
### Get Status & Post-to-wall

For a more instructive example change the above `fbLoginSuccess` to;

	var fbLoginSuccess = function (userData) {
		alert("UserInfo: " + JSON.stringify(userData)); 
    	facebookConnectPlugin.getLoginStatus( 
    		function (status) { 
    			alert("current status: " + JSON.stringify(status)); 
    			
    			var options = { method:"feed" }; 
    			facebookConnectPlugin.showDialog(options, 
    				function (result) {
        				alert("Posted. " + JSON.stringify(result));				}, 
        		function (e) {
    				alert("Failed: " + e);
    			});
    		}
    	);
    };

### Getting A User's Birthday

Using the graph api this is a very simple task: [currently iOS only!]

	facebookConnectPlugin.api("<user-id>/?fields=id,email", ["user_birthday"], 
		function (result) {
			alert("Result: " + JSON.stringify(result));
			/* alerts:
				{
					"id": "000000123456789",
					"email": "myemail@example.com"
				}
			*/
		}, 
		function (error) { 
			alert("Failed: " + error); 
		});
