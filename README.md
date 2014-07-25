# Apache Cordova Facebook Plugin

This is the official plugin for Facebook in Apache Cordova/PhoneGap!

The Facebook plugin for [Apache Cordova](http://incubator.apache.org/cordova/) allows you to use the same JavaScript code in your Cordova application as you use in your web application. However, unlike in the browser, the Cordova application will use the native Facebook app to perform Single Sign On for the user.  If this is not possible then the sign on will degrade gracefully using the standard dialog based authentication.

* Supported on PhoneGap (Cordova) v3.3.0 and above.
* This plugin is built for
	* iOS FacebookSDK 3.15.1
	* Android FacebookSDK 3.15.0

## Facebook Requirements and Set-Up

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an `APP_ID` [https://developers.facebook.com/apps](https://developers.facebook.com/apps).

#### Install Guides

- [iOS Guide](platforms/ios/README.md)

- [Android Guide](platforms/android/README.md)

- [Web App Guide](platforms/web/README.md)

#### Example Apps

`platforms/android` and `platforms/ios` contain example projects and all the native code for the plugin for both Android and iOS platforms. They also include versions of the Android and iOS Facebook SDKs. These are used during automatic installation.

#### Adobe PhoneGap Build

If using this plugin on Adobe PhoneGap Build you can ignore the instructions below and go straight to the
PhoneGap Build documentation available [here] (https://build.phonegap.com/plugins/257).

## API

###facebookConnectPlugin.login(Function success, Function failure)

**NOTE** : Developers should call `facebookConnectPlugin.browserInit(<appId>)` before login - **Web App ONLY** (see [Web App Guide](platforms/web/README.md))

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

Examples -
Feed Dialog:

	{
		method: "feed"
	}

App request:

	{
		method: "apprequests",
		message: "Come on man, check out my application."
	}

Success function returns an Object with `postId` as String or `from` and `to` information when doing `apprequest`.
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

# Events

App events allow you to understand the makeup of users engaging with your app, measure the performance of your Facebook mobile app ads, and reach specific sets of your users with Facebook mobile app ads.

- [iOS] [https://developers.facebook.com/docs/ios/app-events](https://developers.facebook.com/docs/ios/app-events)
- [Android] [https://developers.facebook.com/docs/android/app-events](https://developers.facebook.com/docs/android/app-events)
- [JS] Does not have an Events API, so the plugin functions are empty and will return an automatic success

Activation events are automatically tracked for you in the plugin.

Events are listed on the [insights page](https://www.facebook.com/insights/)

### logEvent(String name, Object params, Number valueToSum, Function success, Function failure)

- **name**, name of the event
- **params**, extra data to log with the event (is optional)
- **valueToSum**, a property which is an arbitrary number that can represent any value (e.g., a price or a quantity). When reported, all of the valueToSum properties will be summed together. For example, if 10 people each purchased one item that cost $10 (and passed in valueToSum) then they would be summed to report a number of $100. (is optional)

### logPurchase(Number value, String currency, Function success, Function failure)

**NOTE:** Both parameters are required. The currency specification is expected to be an [ISO 4217 currency code](http://en.wikipedia.org/wiki/ISO_4217)

## Sample Code

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
