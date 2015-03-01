# Apache Cordova Facebook Plugin

This is the official plugin for Facebook in Apache Cordova/PhoneGap!

The Facebook plugin for [Apache Cordova](http://incubator.apache.org/cordova/) allows you to use the same JavaScript code in your Cordova application as you use in your web application. However, unlike in the browser, the Cordova application will use the native Facebook app to perform Single Sign On for the user.  If this is not possible then the sign on will degrade gracefully using the standard dialog based authentication.

* Supported on PhoneGap (Cordova) v3.5.0 and above.
* This plugin is built for
	* iOS FacebookSDK 3.21.1
	* Android FacebookSDK 3.21.1
* GitHub URL : [https://github.com/Wizcorp/phonegap-facebook-plugin/](https://github.com/Wizcorp/phonegap-facebook-plugin/)

## << --- Cordova Registry Warning [iOS]

****Installing this plugin directly from Cordova Registry results in Xcode using a broken `FacebookSDK.framework`, this is because the current publish procedure to NPM breaks symlinks [CB-6092](https://issues.apache.org/jira/browse/CB-6092). Please install the plugin through a locally cloned copy or re-add the `FacebookSDK.framework` to Xcode after installation.****

## ------------------------------------------ >>

------------------------------------------

## Facebook Requirements and Set-Up

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an `APP_ID` [https://developers.facebook.com/apps](https://developers.facebook.com/apps).

#### Install Guides

- [iOS Guide](platforms/ios/README.md)

- [Android Guide](platforms/android/README.md)

- [Browser Guide](platforms/browser/README.md)

- [PhoneGap Build Guide](platforms/pg-build/README.md)

- [Troubleshooting Guide | F.A.Q.](TROUBLESHOOTING.md)


#### Example Apps

`platforms/android` and `platforms/ios` contain example projects and all the native code for the plugin for both Android and iOS platforms. They also include versions of the Android and iOS Facebook SDKs. These are used during automatic installation.

## API

### Login

`facebookConnectPlugin.login(Array strings of permissions, Function success, Function failure)`

**NOTE** : Developers should call `facebookConnectPlugin.browserInit(<appId>)` before login - **Web App ONLY** (see [Web App Guide](platforms/web/README.md))

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
Feed Dialog:

	{
		method: "feed",
		link: "http://example.com",
		caption: "Such caption, very feed."
	}

App request:

	{
		method: "apprequests",
		message: "Come on man, check out my application."
	}

For options information see: [Facebook feed dialog documentation](https://developers.facebook.com/docs/sharing/reference/feed-dialog/v2.0), [Facebook share dialog documentation](https://developers.facebook.com/docs/sharing/reference/share-dialog)

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

# Events

App events allow you to understand the makeup of users engaging with your app, measure the performance of your Facebook mobile app ads, and reach specific sets of your users with Facebook mobile app ads.

- [iOS] [https://developers.facebook.com/docs/ios/app-events](https://developers.facebook.com/docs/ios/app-events)
- [Android] [https://developers.facebook.com/docs/android/app-events](https://developers.facebook.com/docs/android/app-events)
- [JS] Does not have an Events API, so the plugin functions are empty and will return an automatic success

Activation events are automatically tracked for you in the plugin.

Events are listed on the [insights page](https://www.facebook.com/insights/)

### Log an Event

`logEvent(String name, Object params, Number valueToSum, Function success, Function failure)`

- **name**, name of the event
- **params**, extra data to log with the event (is optional)
- **valueToSum**, a property which is an arbitrary number that can represent any value (e.g., a price or a quantity). When reported, all of the valueToSum properties will be summed together. For example, if 10 people each purchased one item that cost $10 (and passed in valueToSum) then they would be summed to report a number of $100. (is optional)

### Log a Purchase

`logPurchase(Number value, String currency, Function success, Function failure)`

**NOTE:** Both parameters are required. The currency specification is expected to be an [ISO 4217 currency code](http://en.wikipedia.org/wiki/ISO_4217)

## Sample Code

### Login

In your `onDeviceReady` event add the following

	var fbLoginSuccess = function (userData) {
		alert("UserInfo: " + JSON.stringify(userData));
	}

	facebookConnectPlugin.login(["public_profile"],
        fbLoginSuccess,
        function (error) { alert("" + error) }
    );

### Get Access Token

If you need the Facebook access token (for example, for validating the login on server side), do:

	var fbLoginSuccess = function (userData) {
		alert("UserInfo: " + JSON.stringify(userData));
		facebookConnectPlugin.getAccessToken(function(token) {
			alert("Token: " + token);
		}, function(err) {
			alert("Could not get access token: " + err);
		});
	}

	facebookConnectPlugin.login(["public_profile"],
        fbLoginSuccess,
        function (error) { alert("" + error) }
    );

### Get Status and Post-to-wall

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

### Getting a User's Birthday

Using the graph api this is a very simple task:

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

### Publish a Photo

Send a photo to a user's feed

```
facebookConnectPlugin.showDialog( 
    {
        method: "feed",
        picture:'https://www.google.co.jp/logos/doodles/2014/doodle-4-google-2014-japan-winner-5109465267306496.2-hp.png',
        name:'Test Post',
        message:'First photo post',    
        caption: 'Testing using phonegap plugin',
        description: 'Posting photo using phonegap facebook plugin'
    }, 
    function (response) { alert(JSON.stringify(response)) },
    function (response) { alert(JSON.stringify(response)) });
```
