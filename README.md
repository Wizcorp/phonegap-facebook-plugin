# Adobe® PhoneGap™ Build™ plugin for Facebook Connect

---

## DESCRIPTION

The Facebook Connect plugin for [Apache Cordova](http://incubator.apache.org/cordova/) allows you to use the same JavaScript code in your Cordova application as you use in your web application. However, unlike in the browser, the Cordova application will use the native Facebook app to perform Single Sign On for the user.  If this is not possible then the sign on will degrade gracefully using the standard dialog based authentication.

* Supported on PhoneGap (Cordova) v2.1.0 and above.

## Facebook Requirements and Set-Up

Register your application with Facebook to get an [APP_ID](https://developers.facebook.com/apps).

If you plan on rolling this out on iOS, please note that you will need to ensure that you have properly set up your Native iOS App settings on the [Facebook App Dashboard](http://developers.facebook.com/apps). Please see the [Getting Started with the Facebook SDK](https://developers.facebook.com/docs/getting-started/facebook-sdk-for-ios/3.1/): Create a Facebook App section, for more details on this.

[Generate a hash of your Android key(s) and submit those to the Developers page on Facebook](http://developers.facebook.com/docs/mobile/android/build/#sig) to get it working. Furthermore, if you are generating this hash on Windows (specifically 64 bit versions), please use version 0.9.8e or 0.9.8d of [OpenSSL for Windows](http://code.google.com/p/openssl-for-windows/downloads/list) and *not* 0.9.8k. Big ups to [fernandomatos](http://github.com/fernandomatos) for pointing this out!

## Android

View the [Video](http://www.youtube.com/watch?v=mlpBgWiel2w)

1. [Create a basic Cordova Android application](http://docs.phonegap.com/en/2.1.0/guide_getting-started_android_index.md.html#Getting%20Started%20with%20Android).
 * NOTE: Min Target has to be set to 8. The plugin has an issue if you set your minimum target higher than that. You can edit this in your android manifest file.

2. In the Cordova Android application you will need to put the following in your `res/xml/config.xml` file as a child to the plugin tag: <pre>&lt;plugin name="org.apache.cordova.facebook.Connect" value="org.apache.cordova.facebook.ConnectPlugin" /&gt;</pre>

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

NOTE 1: If you are having problems with SBJSON conflicts, download the latest version of git clone the latest cordova-ios code, build the installer, and run the installer to get updated!

NOTE 2: If you're upgrading from SDK 3.0 to 3.1 in the iOS6, you can't ask for both read and write permissions when the user is authenticating. If you do this you'll get a `com.facebook.sdk error 2` error alert. This happens due to a flow change in the 3.1 SDK. More info about this can be found in the [official docs](https://developers.facebook.com/docs/tutorial/iossdk/upgrading-from-3.0-to-3.1/). Also, make sure you have configured the app's Bundle ID in the Facebook app details, under the "Native iOS App" configuration, otherwise you'll get another `com.facebook.sdk error 2` alert. At least, if some of your earlier authentications failed, the device may turn the app to off in Settings > Facebook > Allow These Apps to Use Your Account, so, make sure your app is allowed.

(To be updated) View the [Video](http://www.youtube.com/watch?v=nVxFGiIoPgk&list=UU-b4-PjK0gq4QDpIpsLiFdg&index=1&feature=plcp)

### Create a Basic Cordova App

Create a basic Cordova iOS application by following the [PhoneGap Getting Started Guide](http://docs.phonegap.com/en/2.1.0/guide_getting-started_ios_index.md.html#Getting%20Started%20with%20iOS)

### Add the Facebook iOS and JavaScript SDK

1. Download the latest Facebook SDK for iOS from the [iOS Dev Center](https://developers.facebook.com/ios/).
2. Add the Facebook SDK for iOS Framework by dragging the **FacebookSDK.framework** folder from the SDK installation folder into the Frameworks section of your Project Navigator.
3. Choose 'Create groups for any added folders' and deselect 'Copy items into destination group's folder (if needed)' to keep the reference to the SDK installation folder, rather than creating a copy.
4. Add the Facebook SDK for iOS resource bundle by dragging the **FacebookSDKResources.bundle** file from the **FacebookSDK.framework/Resources** folder into the Frameworks section of your Project Navigator.
5. As you did when copying the Framework, choose 'Create groups for any added folders' and deselect 'Copy items into destination group's folder (if needed)'
6. Add the headers by dragging the **DeprecatedHeaders** folder from the **FacebookSDK.framework/Versions/A/DeprecatedHeaders** folder into the Frameworks section of your Project Navigator.
7. Choose 'Create groups for any added folders' and deselect 'Copy items into destination group's folder (if needed)'. This adds the headers as a reference.
8. Click on your project's icon (the root element) in Project Navigator, select your **Project**, then the **Build Settings** tab, search for **Other Linker Flags**.
9. Add the value **-lsqlite3.0**
10. From the **Cordova Facebook Connect Plugin** folder copy the file **lib/facebook_js_sdk.js** into the **www** directory in Xcode.
11. Click on your project's icon (the root element) in Project Navigator, select your **Target**, then the **Build Phases** tab, then the **Link Binary With Libraries** option.
12. Add the **Social.framework** framework. Make it an optional framework to support pre iOS6 apps.
13. Add the **Accounts.framework** framework. Make it an optional framework to support pre iOS6 apps.
14. Add the **AdSupport.framework** framework. Make it an optional framework to support pre iOS6 apps.

### Add the Cordova Facebook Connect Plugin

1. From the **Cordova Facebook Connect Plugin** folder copy the contents of the **native/ios** folder (without the facebook folder) into your app in Xcode (usually in the **Plugins** folder group). Make sure it is added as a "group" (yellow folder).
2. Find the Cordova.plist file in the project navigator, expand the "Plugins" sub-tree, and add a new entry. For the key, add **org.apache.cordova.facebook.Connect**, and its value will be **FacebookConnectPlugin**
3. From the **Cordova Facebook Connect Plugin** folder copy the contents of the **www** folder into the **www** directory in Xcode.
4. Add the Facebook domains to the ExternalHosts lists, as described below.

### Run the included samples

1. Under the group **Supporting Files**, find your **[PROJECTNAME]-Info.plist**, add a new entry. For the key, add **FacebookAppID**, and its value is your Facebook **APP_ID**
2. Under the group **Supporting Files**, find your **[PROJECTNAME]-Info.plist**, right-click on the file and select **Open As -> Source Code**, add the **URL Scheme** from the section below (you will need your Facebook **APP_ID**)
3. You can quickly test the examples by following the next instructions then mirror the same process for your app.
4. From the **example** folder, copy either the contents of HackBook folder or the Simple folder into your **www** directory in Xcode. Overwrite the original index.html file in your project. For HackBook, overwrite the original css and js folders as well.
5. Make sure the &lt;script&gt; tags are added and are correct in the index.html. This include a tag for cordova-2.1.0.js, facebook_js_sdk.js and cdv-plugin-fb-connect.js.
6. Add your AppID to your index.html. Should be in the callback for the deviceready event. Leave the quotes.
7. Run the application in Xcode.


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

## Automatic Installation
This plugin is based on [pluginstall](https://github.com/phonegap-build/pluginstall). to install it to your app,
simply execute pluginstall as follows;

	pluginstall [PLATFORM] [TARGET-PATH] [PLUGIN-PATH] APP_ID="[APP_ID]"
	
	where
		[PLATFORM] = ios or android
		[TARGET-PATH] = path to folder containing your phonegap project
		[PLUGIN-PATH] = path to folder containing this plugin
		[APP_ID] = Your APP_ID as registered on Facebook

For additional info, take a look at the [Cordova Pluginstall Specification](https://github.com/alunny/cordova-plugin-spec)
