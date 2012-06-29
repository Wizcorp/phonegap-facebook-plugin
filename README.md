# Apache Cordova Facebook Connect Plugin

This is the official plugin for Facebook Connect in Apache Cordova/PhoneGap!

The Facebook Connect plugin for Apache Cordova allows you to use the same JavaScript code in your web application as you use in your native Cordova application, but your native Cordova application will use the Facebook native app to perform Single Sign On for the user (if possible - if it isn't then it will fall back to dialog-based authentication).

This is all licensed under MIT except for `app/www/facebook_js_sdk.js` which is the Facebook JS SDK and is Apache 2.0.

# Requirements

* PhoneGap (Cordova) v1.8.1 (For compatibility with older versions of PhoneGap (1.4.1 or less), please download the tag [1.4.1support](https://github.com/davejohnson/phonegap-plugin-facebook-connect/zipball/1.4.1support))

The Facebook SDK (both native and JavaScript) is changing independent of this plugin. The working versions of the Facebook Android and iOS SDKs are bundled in this project via git submodules.

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an APP_ID (https://developers.facebook.com/apps). If you plan on rolling this out on Android, please note that you will need to [generate a hash of your Android key(s) and submit those to the Developers page on Facebook](http://developers.facebook.com/docs/mobile/android/build/#sig) to get it working. Furthermore, if you are generating this hash on Windows (specifically 64 bit versions), please use version 0.9.8e or 0.9.8d of [OpenSSL for Windows](http://code.google.com/p/openssl-for-windows/downloads/list) and *not* 0.9.8k. Big ups to [fernandomatos](http://github.com/fernandomatos) for pointing this out!

# Project Structure

<pre>
  |-example
  |  `-www
  |    `-index.html
  |-lib
  |  |-facebook-js-patch
  |  |-facebook_js_sdk.js
  |  |-facebook-android-sdk
  |  `-facebook-ios-sdk
  |-native
  |  |-android
  |  `-ios
  `-www
     `-cdv-plugin-fb-connect.js
</pre>

`lib/facebook-js-patch` can be ignored. It is currently not used.

`lib/facebook_js_sdk.js` is the modified facebook-js-sdk. It already includes the hooks to work with this plugin.

`native/android` and `native/ios` contain the native code for the plugin for both Android and iOS platforms.

`www/cdv-plugin-fb-connect.js` is the JavaScript code for the plugin, this defines the JS API.


# Getting Started

## Android

View the [Video](http://www.youtube.com/watch?v=mlpBgWiel2w)

1. [Create a basic Cordova Android application](http://docs.phonegap.com/en/1.8.1/guide_getting-started_android_index.md.html#Getting%20Started%20with%20Android).
 * NOTE: Min Target has to be set to 8. The plugin has an issue if you set your minimum target higher than that. You can edit this in your android manifest file.
 
2. In the Cordova Android application you will need to put the following in your `res/xml/plugins.xml` file: <pre>&lt;plugin name="org.apache.cordova.facebook.Connect" value="org.apache.cordova.facebook.ConnectPlugin" /&gt;</pre>

3. You'll need to build + include the Facebook Android SDK and include the
   Facebook JavaScript SDK:
  * First run `git submodule update --init` to initialize and pull down
    the version of the Android Facebook SDK that works with this plugin; it will end up under `lib/`. Copy the src and res folders from lib/facebook-android-sdk/facebook/ into the root of your Cordova Android application. It should merge with the existing src and res folders and not overwrite. 
  * NOTE: I haven't been able to compile the facebook android SDK into a
    jar with success. So, I just copied the source into my generated
    Cordova application directory and imported the generated Cordova
    Android package as an import at the top of FbDialog.java. 
    
    TODO: Fix this
    :P. `cd facebook-android-sdk/facebook` and run `jar cf
    facebook-android-sdk.jar src`. This will create a
    `facebook-android-sdk.jar` file that you need to copy into your
    generated Cordova-Android's `libs` directory (and also add to your
    build path). 

4. From the Cordova Facebook Connect Plugin folder copy the src folder from `native/android/` folder into the root of your Cordova Android application. It should merge with the existing src folder. 

5. From the Cordova Facebook Connect Plugin folder copy the `www/cdv-plugin-fb-connect.js`, `lib/facebook_js_sdk.js` and `example/HackBook/` files into your application's `assets/www` folder. Overwrite the existing index.html file.

6. Replace your appId in the new index.html file. Leave the quotes.

Now you are ready to create your application! Check out the `example` folder for what the HTML, JS etc looks like.

You can run the application from either the command line (`ant clean && ant debug install`) or from Eclipse.

## iOS (Mac OS X)

NOTE: If you are having problems with SBJSON conflicts, download the latest version of git clone the latest cordova-ios code, build the installer, and run the installer to get updated!

View the [Video](http://www.youtube.com/watch?v=nVxFGiIoPgk&list=UU-b4-PjK0gq4QDpIpsLiFdg&index=1&feature=plcp)

1. Create a basic Cordova iOS application by following the [PhoneGap Getting Started Guide](http://docs.phonegap.com/en/1.8.1/guide_getting-started_ios_index.md.html#Getting%20Started%20with%20android)
2. From the **Cordova Facebook Connect Plugin** folder copy the contents of the **native/ios** folder into your app in Xcode (usually in the **Plugins** folder group). Make sure it is added as a "group" (yellow folder)
3. Find the Cordova.plist file in the project navigator, expand the "Plugins" sub-tree, and add a new entry. For the key, add **org.apache.cordova.facebook.Connect**, and its value will be **FacebookConnectPlugin**
4. From the **example** folder, copy either the contents of HackBook folder or the Simple folder into your **www** directory in Xcode. Overwrite the original index.html file in your project.
5. From the **Cordova Facebook Connect Plugin** folder copy the contents of the **www** folder into the **www** directory in Xcode. If you do not find a **www** folder in Xcode, you need to go back to step one and make sure to follow all the steps.
6. Under the group **Supporting Files**, find your **[PROJECTNAME]-Info.plist**, right-click on the file and select **Open As -> Source Code**, add the **URL Scheme** from the section below (you will need your Facebook **APP_ID**)
7. Run **git submodule update --init** to initialize and pull down the versions of the android and iOS Facebook SDKs that work with this plugin; they will end up under **lib/**.
8. From the **Cordova Facebook Connect Plugin** folder copy the file **lib/facebook_js_sdk.js** into the **www** directory in Xcode
9. From `lib/facebook-ios-sdk` Remove **facebook-ios-sdk.xcodeproj** and **facebook_ios_sdk_Prefix.pch** files. Drag the **src** folder into your project under **Plugins** folder and make sure it is added as a "group" (yellow folder)
10. Click on your project's icon (the root element) in Project Navigator, select your **Target**, then the **Build Settings** tab, search for **Header Search Paths**.
11. Add the value **/Users/Shared/Cordova/Frameworks/Cordova.framework/Headers**
12. Add the Facebook domains to the ExternalHosts lists, as described below.
13. Make sure the &lt;script&gt; tags are added and are correct in the index.html. This include a tag for cordova-1.8.1.js, facebook_js_sdk.js and cdv-plugin-fb-connect.js.
14. Add your AppID to your index.html. Should be in the callback for the deviceready event. Leave the quotes. 
15. Run the application in Xcode.


### iOS URL Whitelist

The Facebook SDK will try to access various URLs, and their domains must be whitelisted in your Cordova.plist under ExternalHosts.

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



