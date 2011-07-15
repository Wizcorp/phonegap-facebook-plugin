Facebook Connect PhoneGap Plugin
================================

Offical plugin for Facebook Connect.

This is all licensed under MIT except for app/www/facebook.js which is the Facebook JS SDK and is Apache 2.0.

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


iOS (OS X)
-----------

Get the latest iOS source from http://github.com/phonegap/phonegap-iphone and read the readme there about getting started with iOS.

Create a new xcode project from the PhoneGap template that you created and installed (you did that if you read the readme on github I hope).

From the PhoneGap Facebook Connect Plugin folder copy the contents of the native/ios folder into you app in xcode.

Open the plugins.plist file in xcode and add an entry for com.facebook.phonegap.Connect ... SHAZ CAN YOU PLS ELABORATE?

From the PhoneGap Facebook Connect Plugin folder copy the app/www folder into the www directory in xcode overwriting the index.html and icon.png files but keeping the phonegap...js file.

From the PhoneGap Facebook Connect Plugin folder copy the www folder into the www directory in xcode.

Run the application in xcode.



IGNORE THIS STUFF BELOW FOR NOW...

iOS Testing
-----------

Make sure you add the scheme to your [PROJECTNAME]-Info.plist, substitute [APP_ID] and [SCHEME_ID] below to the appropriate values. This is to handle the re-direct from Mobile Safari, after permission authorization.

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