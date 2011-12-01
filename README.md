PhoneGap Facebook Connect Plugin
================================

This is the offical plugin for Facebook Connect in PhoneGap!

The Facebook Connect plugin for PhoneGap allows you to use the same JavaScript code in your web application as you 
use in your native PhoneGap application, but your native PhoneGap application will use the Facebook native app to 
perform single sign on (SSO) for the user.

This is all licensed under MIT except for app/www/facebook_js_sdk.js which is the Facebook JS SDK and is Apache 2.0.


Getting Started
===============

Download the latest version of PhoneGap from www.phonegap.com.

Create an Android or iOS PhoneGap project -- those are the only platforms that the Facebook native application 
currently runs on :(

Check out the /example/www/index.html to see how it works.

<pre>
|-lib
|  `-facebook_js_sdk.js
|-natve
|  |-android
|  |-ios
`-www
   `-pg-plugin-fb-connect.js
</pre>

/lib/facebook_js_sdk.js is the modified facebook js sdk, these modifications will be in their repo soon.

/native/android | ios is the native code for the plugin on both android and ios platforms.

/www/pg-plugin-fb-connect.js is the JavaScript code for the plugin, this defines the public JS API.

Currently this plugin does not support dialogs, that is coming soon!

The Facebook SDK (both native and JavaScript) is changing independent of this plugin. The working version of the Facebook Android SDK is distributed with the plugin and as of writing this the supported Facebook iOS SDK commit SHA1 is 91f256424531030a454548693c3a6ca49ca3f35a.

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an APP_ID and APP_SECRET (https://developers.facebook.com/apps).


Android
===============

1. Create a basic PhoneGap Android application. See http://www.phonegap.com/start/#android
2. In the PhoneGap Android application you will need to put the following in your /res/xml/plugins.xml file: <pre>&lt;plugin name="com.phonegap.facebook.Connect" value="com.phonegap.facebook.ConnectPlugin" /&gt;</pre>
3. In the PhoneGap Android application you will need to define your `APP_SECRET` inside the &lt;application&gt; element in the /AndroidManifest.xml file like this: <pre>&lt;meta-data android:name="app_secret" android:value="your_app_secret" /&gt;</pre>
4. From the PhoneGap Facebook Connect Plugin folder copy the contents of the /native/android/ folder into the root of your PhoneGap Android application, add the Facebook Android SDK to the build path.
5. From the PhoneGap Facebook Connect Plugin folder copy the /www/pg-plugin-fb-connect.js and /lib/facebook_js_sdk.js files into your /assets/www/ folder.

Now you are ready to create your application! Check out the example folder for what the HTML, JS etc looks like. Note that you will need to replace your appId if you use the example index.html file.

You can run the application from either the command line (ant debug install) or from Eclipse.


iOS (Mac OS X)
===============

NOTE: If you are having problems with SBJSON conflicts, download the latest version of git clone the latest callback-ios code, build the installer, and run the installer to get updated!

1. Create a basic PhoneGap iOS application. See http://www.phonegap.com/start/#ios-x4
2. From the **PhoneGap Facebook Connect Plugin** folder copy the contents of the **native/ios** folder into your app in Xcode (usually in the **Plugins** folder group). Make sure it is added as a "group" (yellow folder)
3. Modify the **APP__SECRET** value in **FacebookConnectPlugin.m** with your Facebook app's **APP__SECRET**
4. Find the PhoneGap.plist file in the project navigator, expand the "Plugins" sub-tree, and add a new entry. For the key, add **com.phonegap.facebook.Connect**, and its value will be **FacebookConnectPlugin**
5. From the **PhoneGap Facebook Connect Plugin** folder copy the contents of the **www** folder into the **www** directory in Xcode (don't forget to add script tags in your index.html to reference any .js files copied over)
6. From the **PhoneGap Facebook Connect Plugin** folder copy the contents of the **lib** folder into the **www** directory in Xcode (don't forget to add script tags in your index.html to reference any .js files copied over)
7. for Xcode 4, you will need to build it once, and heed the warning - this is an Xcode 4 template limitation. The warning instructions will tell you to drag copy the **www** folder into the project in Xcode (add as a **folder reference** which is a blue folder).
8. Under the group **Supporting Files**, find your **[PROJECTNAME]-Info.plist**, right-click on the file and select **Open As -> Source Code**, add the **URL Scheme** from the section below (you will need your Facebook **APP_ID**)
9. Download the **Facebook iOS SDK** from [https://github.com/facebook/facebook-ios-sdk](https://github.com/facebook/facebook-ios-sdk) and put it into your project folder (currently works with version 91f256424531030a454548693c3a6ca49ca3f35a)
10. Drag the **facebook-ios-sdk.xcodeproj** file into your project, this will create it as a sub-project
11. Click on your project's icon (the root element) in Project Navigator, select your **Target**, and the **Build Phases** tab.
12. From the **Build Phases** tab, expand **Target Dependencies**, then click on the **+** button
13. Add the build product from the **facebook-ios-sdk sub-project**
14. From the **Build Settings** tab, search for **Header Search Paths**
15. Add the value **/Users/Shared/PhoneGap/Frameworks/PhoneGap.framework/Headers**
16. From the **facebook-ios-sdk.xcodeproj** sub-project, drag out the **FBConnect** folder into your project's **Plugins** folder, and add it as a group (yellow folder).
17. Add the Facebook domains to the ExternalHosts lists, as described below.
18. Run the application in Xcode.


iOS URL Whitelist
-----------

The Facebook SDK will try to access various URLs, and their domains must be whitelisted in your PhoneGap.plist under ExternalHosts.
You can either add each subdomain separately:
* m.facebook.com*
* graph.facebook.com*
* api.facebook.com*

Or you can allow all Facebook domains with:
* *.facebook.com*

iOS URL Scheme
-----------

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
