# cordova-plugin-facebook4

> Use Facebook SDK in Cordova projects

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Sample repo](#sample-repo)
- [Compatibility](#compatibility)
- [Facebook SDK](#facebook-sdk)
- [API](#api)

## Installation

See npm package for versions - https://www.npmjs.com/package/cordova-plugin-facebook4

Make sure you've registered your Facebook app with Facebook and have an `APP_ID` [https://developers.facebook.com/apps](https://developers.facebook.com/apps).

```bash
$ cordova plugin add cordova-plugin-facebook4 --save --variable APP_ID="123456789" --variable APP_NAME="myApplication"
```

If you need to change your `APP_ID` after installation, it's recommended that you remove and then re-add the plugin as above. Note that changes to the `APP_ID` value in your `config.xml` file will *not* be propagated to the individual platform builds.

IMPORTANT: This plugin works as is with cordova-ios 5 but if you use earlier version of cordova-ios then you need to add the code in the following comment to your CordovaLib/Classes/Public/CDVAppDelegate.m file which was added to your project as part of the cordova-ios ios platform template: https://github.com/apache/cordova-ios/issues/476#issuecomment-460907247

### Installation Guides

- [iOS Guide](docs/ios/README.md)

- [Android Guide](docs/android/README.md)

- [Browser Guide](docs/browser/README.md)

- [Troubleshooting Guide | F.A.Q.](docs/TROUBLESHOOTING.md)

## Usage

This is a fork of the [official plugin for Facebook](https://github.com/Wizcorp/phonegap-facebook-plugin/) in Apache Cordova that implements the latest Facebook SDK. Unless noted, this is a drop-in replacement. You don't have to replace your client code.

The Facebook plugin for [Apache Cordova](http://cordova.apache.org/) allows you to use the same JavaScript code in your Cordova application as you use in your web application. However, unlike in the browser, the Cordova application will use the native Facebook app to perform Single Sign On for the user.  If this is not possible then the sign on will degrade gracefully using the standard dialog based authentication.

## Sample Repo

If you are looking to test the plugin, would like to reproduce a bug or build issues, there is a demo project for such purpose: [cordova-plugin-facebook4-lab](https://github.com/peterpeterparker/cordova-plugin-facebook4-lab).

## Compatibility

  * Cordova >= 5.0.0
  * cordova-android >= 4.0
  * cordova-ios >= 3.8
  * cordova-browser >= 3.6
  * Phonegap build (use phonegap-version >= cli-5.2.0, android-minSdkVersion>=15, and android-build-tool=gradle), see [example here](https://github.com/yoav-zibin/phonegap-tictactoe/blob/gh-pages/www/config.xml)

## Facebook SDK

This plugin use the SDKs provided by Facebook. More information about these in their documentation for [iOS](https://developers.facebook.com/docs/ios/) or [Android](https://developers.facebook.com/docs/android/)

### Facebook SDK version

As of v3.0.0, this plugin will always be released for iOS and for Android with a synchronized usage of the Facebook SDKs

For example: v3.0.0 include the Facebook SDK iOS v4.36.0 and reference per default the Facebook SDK Android v4.36.0 too

### Graph API version

Please note that this plugin itself does not specify which Graph API version is used. The Graph API version is set by the Facebook SDK for iOS and Android (see [Facebook documentation about versioning](https://developers.facebook.com/docs/apps/versions/))

## API

### Login

`facebookConnectPlugin.login(Array strings of permissions, Function success, Function failure)`

Success function returns an Object like:

	{
		status: "connected",
		authResponse: {
			session_key: true,
			accessToken: "<long string>",
			expiresIn: 5183979,
			sig: "...",
			secret: "...",
			userID: "634565435"
		}
	}

Failure function returns an error String.

### Logout

`facebookConnectPlugin.logout(Function success, Function failure)`

### Check permissions (iOS only)

`facebookConnectPlugin.checkHasCorrectPermissions(Array strings of permissions, Function success, Function failure)`

Success function returns a success string if all passed permissions are granted.

Failure function returns an error String if any passed permissions are not granted.

### Get Status

`facebookConnectPlugin.getLoginStatus(Function success, Function failure)`

Success function returns an Object like:

```
{
	authResponse: {
		userID: "12345678912345",
		accessToken: "kgkh3g42kh4g23kh4g2kh34g2kg4k2h4gkh3g4k2h4gk23h4gk2h34gk234gk2h34AndSoOn",
		session_Key: true,
		expiresIn: "5183738",
		sig: "..."
	},
	status: "connected"
}
```
For more information see: [Facebook Documentation](https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus)

### Show a Dialog

`facebookConnectPlugin.showDialog(Object options, Function success, Function failure)`

Example options -
Share Dialog:

	{
		method: "share",
		href: "http://example.com",
		caption: "Such caption, very feed.",
		description: "Much description",
		picture: 'http://example.com/image.png',
		hashtag: '#myHashtag',
		share_feedWeb: true, // iOS only
	}

#### iOS

The default dialog mode is [`FBSDKShareDialogModeAutomatic`](https://developers.facebook.com/docs/reference/ios/current/constants/FBSDKShareDialogMode/). You can share that by adding a specific dialog mode parameter. The available share dialog modes are: `share_sheet`, `share_feedBrowser`, `share_native` and `share_feedWeb`. [Read more about share dialog modes](https://developers.facebook.com/docs/reference/ios/current/constants/FBSDKShareDialogMode/)

`caption`, `description` and `picture` were deprecated in Facebok API [v2.9](https://developers.facebook.com/docs/graph-api/changelog/version2.9#gapi-deprecate) and therefore not supported anymore on iOS 

Game request:

	{
		method: "apprequests",
		message: "Come on man, check out my application.",
		data: data,
		title: title,
		actionType: 'askfor',
		filters: 'app_non_users'
	}

Send Dialog:

	{
		method: "send",
		caption: "Check this out.",
		link: "http://example.com",
		description: "The site I told you about",
		picture: "http://example.com/image.png"
	}
	
Share dialog - Open Graph Story: (currently only fully available on Android, iOS currently does not support action_properties)

	{
		var obj = {};
	
    	obj['og:type'] = 'objectname';
    	obj['og:title'] = 'Some title';
    	obj['og:url'] = 'https://en.wikipedia.org/wiki/Main_Page';
    	obj['og:description'] = 'Some description.';

    	var ap = {};
    	
    	ap['expires_in'] = 3600;
    	
    	var options = {
    		method: 'share_open_graph', // Required
        	action: 'actionname', // Required
        	action_properties: JSON.stringify(ap), // Optional
        	object: JSON.stringify(obj) // Required
    	};
	}
	
In case you want to use custom actions/objects, just prepend the app namespace to the name (E.g: ` obj['og:type'] = 'appnamespace:objectname' `, `action: 'appnamespace:actionname'`. The namespace of a Facebook app is found on the Settings page. 


For options information see: [Facebook share dialog documentation](https://developers.facebook.com/docs/sharing/reference/share-dialog) [Facebook send dialog documentation](https://developers.facebook.com/docs/sharing/reference/send-dialog)

Success function returns an Object with `postId` as String or `from` and `to` information when doing `apprequest`.
Failure function returns an error String.

### The Graph API

`facebookConnectPlugin.api(String requestPath, Array permissions, Function success, Function failure)`

Allows access to the Facebook Graph API. This API allows for additional permission because, unlike login, the Graph API can accept multiple permissions.

Example permissions:

	["public_profile", "user_birthday"]

Success function returns an Object.

Failure function returns an error String.

**Note: "In order to make calls to the Graph API on behalf of a user, the user has to be logged into your app using Facebook login."**

For more information see:

- Calling the Graph API - [https://developers.facebook.com/docs/ios/graph](https://developers.facebook.com/docs/ios/graph)
- Graph Explorer - [https://developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
- Graph API - [https://developers.facebook.com/docs/graph-api/](https://developers.facebook.com/docs/graph-api/)

### Events

App events allow you to understand the makeup of users engaging with your app, measure the performance of your Facebook mobile app ads, and reach specific sets of your users with Facebook mobile app ads.

- [iOS] [https://developers.facebook.com/docs/ios/app-events](https://developers.facebook.com/docs/ios/app-events)
- [Android] [https://developers.facebook.com/docs/android/app-events](https://developers.facebook.com/docs/android/app-events)
- [JS] Does not have an Events API, so the plugin functions are empty and will return an automatic success

Activation events are automatically tracked for you in the plugin.

Events are listed on the [insights page](https://www.facebook.com/insights/)

#### Log an Event

`logEvent(String name, Object params, Number valueToSum, Function success, Function failure)`

- **name**, name of the event
- **params**, extra data to log with the event (is optional)
- **valueToSum**, a property which is an arbitrary number that can represent any value (e.g., a price or a quantity). When reported, all of the valueToSum properties will be summed together. For example, if 10 people each purchased one item that cost $10 (and passed in valueToSum) then they would be summed to report a number of $100. (is optional)

#### Log a Purchase

`logPurchase(Number value, String currency, Function success, Function failure)`

**NOTE:** Both parameters are required. The currency specification is expected to be an [ISO 4217 currency code](http://en.wikipedia.org/wiki/ISO_4217)

#### Manually log activation events

`activateApp(Function success, Function failure)`

### Login

In your `onDeviceReady` event add the following

```js
var fbLoginSuccess = function (userData) {
  console.log("UserInfo: ", userData);
}

facebookConnectPlugin.login(["public_profile"], fbLoginSuccess,
  function loginError (error) {
    console.error(error)
  }
);
```

### Get Access Token

If you need the Facebook access token (for example, for validating the login on server side), do:
```js
var fbLoginSuccess = function (userData) {
  console.log("UserInfo: ", userData);
  facebookConnectPlugin.getAccessToken(function(token) {
    console.log("Token: " + token);
  });
}

facebookConnectPlugin.login(["public_profile"], fbLoginSuccess,
  function (error) {
    console.error(error)
  }
);
```

### Get Status and Post-to-wall

For a more instructive example change the above `fbLoginSuccess` to;

```js
var fbLoginSuccess = function (userData) {
  console.log("UserInfo: ", userData);
  facebookConnectPlugin.getLoginStatus(function onLoginStatus (status) {
    console.log("current status: ", status);
    facebookConnectPlugin.showDialog({
      method: "share"
    }, function onShareSuccess (result) {
      console.log("Posted. ", result);
    });
  });
};
```

### Getting a User's Birthday

Using the graph api this is a very simple task:

```js
facebookConnectPlugin.api("<user-id>/?fields=id,email", ["user_birthday"],
  function onSuccess (result) {
    console.log("Result: ", result);
    /* logs:
      {
        "id": "000000123456789",
        "email": "myemail@example.com"
      }
    */
  }, function onError (error) {
    console.error("Failed: ", error);
  }
);
```

### Publish a Photo

Send a photo to a user's feed

```js
facebookConnectPlugin.showDialog({
    method: "share",
    picture:'https://www.google.co.jp/logos/doodles/2014/doodle-4-google-2014-japan-winner-5109465267306496.2-hp.png',
    name:'Test Post',
    message:'First photo post',
    caption: 'Testing using phonegap plugin',
    description: 'Posting photo using phonegap facebook plugin'
  }, function (response) {
    console.log(response)
  }, function (response) {
    console.log(response)
  }
);
```

### Hybrid Mobile App Events

Starting from Facebook SDK v4.34 for both iOS and Android, there is a new way of converting pixel events into mobile app events. For more information: [https://developers.facebook.com/docs/app-events/hybrid-app-events/](https://developers.facebook.com/docs/app-events/hybrid-app-events/)

In order to enable this feature in your cordova app, please set the *FACEBOOK_HYBRID_APP_EVENTS* variable to "true"(default is false):
```bash
$ cordova plugin add cordova-plugin-facebook4 --save --variable APP_ID="123456789" --variable APP_NAME="myApplication" --variable FACEBOOK_HYBRID_APP_EVENTS="true"
```
Please check [this repo](https://github.com/msencer/fb_hybrid_app_events_sample) for an example app using this feature.

**NOTE(iOS):** This feature only works with WKWebView so until [Cordova iOS 5 is relased](https://cordova.apache.org/news/2018/08/01/future-cordova-ios-webview.html), an additional plugin (e.g cordova-plugin-wkwebview-engine) is needed.
