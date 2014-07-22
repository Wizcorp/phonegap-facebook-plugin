# Facebook Requirements and Set-Up [Web App]

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an `APP_ID` [https://developers.facebook.com/apps](https://developers.facebook.com/apps).

This guide is for browser only. View the other guides for native setup.

`www/js/facebookConnectPlugin.js` contains the JavaScript SDK and API file. The API matches as close as possible to the native APIs.

## Example App

Host the `www` folder on a server and configure your Facebook dashboard correctly to test the Web APIs. Most people use [Parse](https://parse.com/) for easy testing. Check this guide to create a sample web app with Parse [Create a FB WebApp with Parse](guide/PARSE_GUIDE.md).


## Note

The only difference between the JS API and Native is that the web app must be initiated. Here is an example:

	if (!window.cordova) {
    	facebookConnectPlugin.browserInit(appId, version);
    	// version is optional. It refers to the version of API you may want to use.
	}