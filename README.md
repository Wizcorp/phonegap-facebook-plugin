# PhoneGap Facebook Connect Plugin

This is the offical plugin for Facebook Connect in PhoneGap!

The Facebook Connect plugin for PhoneGap allows you to use the same JavaScript code in your web application as you 
use in your native PhoneGap application, but your native PhoneGap application will use the Facebook native app to 
perform Single Sign On for the user (if possible - if it isn't then it
will fall back to dialog-based authentication).

This is all licensed under MIT except for `app/www/facebook_js_sdk.js` which is the Facebook JS SDK and is Apache 2.0.

# Requirements

* PhoneGap v1.0 - 1.4.1

The Facebook SDK (both native and JavaScript) is changing independent of this plugin. The working versions of the Facebook Android, JS and iOS SDKs are bundled in this project via git submodules.

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an APP_ID (https://developers.facebook.com/apps). If you plan on rolling this out on Android, please note that you will need to [generate a hash of your Android key(s) and submit those to the Developers page on Facebook](http://developers.facebook.com/docs/mobile/android/build/#sig) to get it working. Furthermore, if you are generating this hash on Windows (specifically 64 bit versions), please use version 0.9.8e or 0.9.8d of [OpenSSL for Windows](http://code.google.com/p/openssl-for-windows/downloads/list) and *not* 0.9.8k. Big ups to [fernandomatos](http://github.com/fernandomatos) for pointing this out!

# Project Structure

<pre>
  |-example
  |  `-www
  |    `-index.html
  |-lib
  |  |-facebook-js-patch
  |  |-facebook-js-sdk
  |  |-facebook-android-sdk
  |  `-facebook-ios-sdk
  |-native
  |  |-android
  |  `-ios
  `-www
     `-pg-plugin-fb-connect.js
</pre>

`lib/facebook-js-patch` is a diff file between the facebook-js-sdk and
the modified file to get it working with this plugin. This plugin
monkey-patches some of the facebook-js-sdk methods to hook in an
interface into the native Facebook SDKs.

`lib/facebook_js_sdk` is the modified facebook-js-sdk. It already includes the hooks to work with this plugin.

`native/android` and `native/ios` contain the native code for the plugin for both Android and iOS platforms.

`www/pg-plugin-fb-connect.js` is the JavaScript code for the plugin, this defines the JS API.


# Getting Started

We've provided a few `install` scripts to get you rolling pretty quick. PLEASE NOTE: only Android works for the `install` scripts at this time.

1. Download the latest version of PhoneGap from www.phonegap.com.

2. Create an Android or iOS PhoneGap project. Let's assume you have this
   project under `~/phonegap-facebook`.

3. Make sure you pull down all of the submodules by running `git
   submodule update --init`.

4. Depending what you've got handy, you could:
  * ruby (TODO!): `./install ~/phonegap-facebook <platform>`
  * node: `node install.js ~/phonegap-facebook <platform>`
  * Windows (TODO!): `install.bat ~/phonegap-facebook
    <platform>`

In the above, `<platform>` represents either "android" or "ios".

If you don't like this script magic, you can always roll up your sleeves
and get into the nitty-gritty for the platform of your choice:

## Android

1. [Create a basic PhoneGap Android application](http://www.phonegap.com/start/#android).

2. In the PhoneGap Android application you will need to put the following in your `res/xml/plugins.xml` file: <pre>&lt;plugin name="com.phonegap.facebook.Connect" value="com.phonegap.facebook.ConnectPlugin" /&gt;</pre>

3. You'll need to build + include the Facebook Android SDK and build + patch the
   Facebook JavaScript SDK:
  * First run `git submodule update --init` to initialize and pull down
    the versions of the JS and Android Facebook SDKs that work with this plugin; they will end up under `lib/`.
  * Next, build the JS file. `cd lib/facebook-js-sdk` and run `php
    all.js.php >> ../facebook_js_sdk.js`. This will create the JS SDK file
    under `lib/facebook_js_sdk.js`. Please note: the output filename is
    important as the patch assumes that filename!
  * `cd ..` and apply the patch file by running `patch <
    facebook-js-patch`.
  * NOTE: I haven't been able to compile the facebook android SDK into a
    jar with success. So, I just copied the source into my generated
    PhoneGap application directory and imported the generated PhoneGap
    Android package as an import at the top of FbDialog.java. TODO: Fix this
    :P. `cd facebook-android-sdk/facebook` and run `jar cf
    facebook-android-sdk.jar src`. This will create a
    `facebook-android-sdk.jar` file that you need to copy into your
    generated PhoneGap-Android's `libs` directory (and also add to your
    build path). 

4. From the PhoneGap Facebook Connect Plugin folder copy the contents of the `native/android/` folder into the root of your PhoneGap Android application.

5. From the PhoneGap Facebook Connect Plugin folder copy the `www/pg-plugin-fb-connect.js` and `lib/facebook_js_sdk.js` files into your application's `assets/www` folder.

Now you are ready to create your application! Check out the `example` folder for what the HTML, JS etc looks like. Note that you will need to replace your appId if you use the example index.html file.

You can run the application from either the command line (`ant clean && ant debug install`) or from Eclipse.

## iOS (Mac OS X)

NOTE: If you are having problems with SBJSON conflicts, download the latest version of git clone the latest cordova-ios code, build the installer, and run the installer to get updated!

1. Create a basic PhoneGap iOS application. See http://www.phonegap.com/start/#ios-x4
2. From the **PhoneGap Facebook Connect Plugin** folder copy the contents of the **native/ios** folder into your app in Xcode (usually in the **Plugins** folder group). Make sure it is added as a "group" (yellow folder)
SKIP -> 3. Modify the **APP\_SECRET** value in **FacebookConnectPlugin.m** with your Facebook app's **APP\_SECRET**
4. Find the PhoneGap.plist file in the project navigator, expand the "Plugins" sub-tree, and add a new entry. For the key, add **com.phonegap.facebook.Connect**, and its value will be **FacebookConnectPlugin**
5. From the **PhoneGap Facebook Connect Plugin** folder copy the contents of the **www** folder into the **www** directory in Xcode (don't forget to add script tags in your index.html to reference any .js files copied over)
6. for Xcode 4, you will need to build it once, and heed the warning - this is an Xcode 4 template limitation. The warning instructions will tell you to drag copy the **www** folder into the project in Xcode (add as a **folder reference** which is a blue folder).
7. Under the group **Supporting Files**, find your **[PROJECTNAME]-Info.plist**, right-click on the file and select **Open As -> Source Code**, add the **URL Scheme** from the section below (you will need your Facebook **APP_ID**)
8. Run **git submodule update --init** to initialize and pull down the versions of the JS and iOS Facebook SDKs that work with this plugin; they will end up under **lib/**.
IGNORE STEP 9 & 10 
SKIP -> 9. Next, **build and patch**  the JS file:
 
        cd lib/facebook-js-sdk && php all.js.php >> ../facebook_js_sdk.js && cd .. && patch < facebook-js-patch 

SKIP -> 10. This will create and patch the JS SDK file under **lib/facebook_js_sdk.js**. Please note: the output filename is important as the patch assumes that filename!
        
11. From the **PhoneGap Facebook Connect Plugin** folder copy the file **lib/facebook_js_sdk.js** into the **www** directory in Xcode (don't forget to add script tags in your index.html to reference the .js file copied over)

12. From `lib/facebook-ios-sdk` Remove **facebook-ios-sdk.xcodeproj** and **facebook_ios_sdk_Prefix.pch** files. Drag the **src** folder into your project under **Plugins** folder and make sure it is added as a "group" (yellow folder)
13. Click on your project's icon (the root element) in Project Navigator, select your **Target**, then the **Build Settings** tab, search for **Header Search Paths**.
14. Add the value **/Users/Shared/PhoneGap/Frameworks/PhoneGap.framework/Headers**
15. Add the Facebook domains to the ExternalHosts lists, as described below.
17. Run the application in Xcode.


### iOS URL Whitelist

The Facebook SDK will try to access various URLs, and their domains must be whitelisted in your PhoneGap.plist under ExternalHosts.

You can either add each subdomain separately:

* m.facebook.com
* graph.facebook.com
* api.facebook.com
* \*.fbcdn.net
* \*.akamaihd.net

Or you can allow all domains with:

* \*

### iOS URL Scheme

Make sure you add the scheme to your [PROJECTNAME]-Info.plist (located as one of the files in your Xcode project), substitute [APP_ID] and [SCHEME_ID] below to the appropriate values. This is to handle the re-direct from Mobile Safari or the Facebook app, after permission authorization.

* [**SCHEME_ID**] is usually a unique identifier for the scheme, in reverse domain name notation (i.e com.facebook.phonegap.myscheme)
* [**APP_ID**] is the Facebook app id given by Facebook

<pre>
&lt;key&gt;CFBundleURLTypes&lt;/key&gt;
&lt;array&gt;
	&lt;dict&gt;
		&lt;key&gt;CFBundleURLName&lt;/key&gt;
		&lt;string&gt;[SCHEME_ID]&lt;/string&gt;
		&lt;key&gt;CFBundleURLSchemes&lt;/key&gt;
		&lt;array&gt;
			&lt;string&gt;fb[APP_ID]&lt;/string&gt;
		&lt;/array&gt;
	&lt;/dict&gt;
&lt;/array&gt;
</pre>



