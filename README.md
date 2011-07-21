Facebook Connect PhoneGap Plugin
================================

Offical plugin for Facebook Connect.

This is all licensed under MIT except for app/www/facebook_js_sdk.js which is the Facebook JS SDK and is Apache 2.0.

Android (OS X)
-----------

Get the latest Android source from http://github.com/phonegap/phonegap-android and read the readme there about getting started with Android.

From terminal run the following command:

<pre>
droidgap gen foobar
</pre>

In foobar/res/xml/plugins.xml add the following element as a child of the root plugins element:

<pre>
&lt;plugin name="com.facebook.phonegap.Connect" value="com.facebook.phonegap.Connect" /&gt;
</pre>

From the PhoneGap Facebook Connect Plugin folder copy the contents of the native/android/ folder into foobar/

From the PhoneGap Facebook Connect Plugin folder copy the app/www folder into foobar/assets/ overwriting the index.html and icon.png files but keeping the phonegap...js file.

From the PhoneGap Facebook Connect Plugin folder copy the www folder into foobar/assets/

From terminal in the foobar folder (with an android device attached to your computer) run the following command:

<pre>
ant debug install
</pre>


iOS (Mac OS X)
--------------

1. Get the latest iOS source from http://github.com/phonegap/phonegap-iphone and read the README there about getting started with iOS.
2. Create a new Xcode project from the PhoneGap template that you created and installed (you did that if you read the README on github I hope).
3. From the 'PhoneGap Facebook Connect Plugin' folder copy the contents of the native/ios folder into your app in Xcode (usually in the Plugins folder group).
4. Find the PhoneGap.plist file in the project navigator, expand the "Plugins" sub-tree, and add a new entry. For the key, add "com.facebook.phonegap.Connect", and its value will be "FacebookConnectPlugin"
5. From the' PhoneGap Facebook Connect Plugin' folder copy contents of the app/www folder into the www directory in Xcode overwriting the index.html and icon.png files but keeping the phonegap.*.js file 
6. for Xcode 4, you will need to build it once, and heed the warning - this is an Xcode 4 template limitation. The warning instructions will tell you to drag copy the www folder into the project in Xcode.
7. Run the application in Xcode.
8. Add the URL Scheme for your app below

iOS URL Scheme
-----------

Make sure you add the scheme to your [PROJECTNAME]-Info.plist (located as one of the files in your Xcode project), substitute [APP_ID] and [SCHEME_ID] below to the appropriate values. This is to handle the re-direct from Mobile Safari or the Facebook app, after permission authorization.

* [SCHEME_ID] is usually a unique identifier for the scheme, in reverse domain name notation (i.e com.facebook.phonegap.myscheme)
* [APP_ID] is the Facebook app id given by Facebook

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