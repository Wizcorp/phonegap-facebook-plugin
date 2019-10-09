<a name="6.2.0"></a>
# [6.2.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v6.1.0)

## Features

* **iOS:** Update Facebook iOS SDK v5.7.0 ([Facebook iOS SDK changelog](https://github.com/facebook/facebook-objc-sdk/blob/master/CHANGELOG.md) | Released: September 30 2019)
* **Android:** Set per default usage of Facebook Android SDK v5.5.2 ([Facebook Android SDK changelog](https://github.com/facebook/facebook-android-sdk/blob/master/CHANGELOG.md) | Released: October 4 2019)

## Docs

* Document two known errors related to Cocoapods, Facebook iOS SDK and their related solutions

<a name="6.1.0"></a>
# [6.1.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v6.1.0)

## Features

* **iOS:** Update Facebook iOS SDK v5.6.0 ([Facebook iOS SDK changelog](https://github.com/facebook/facebook-objc-sdk/blob/master/CHANGELOG.md) | Released: July 15 2019)
* **Android:** Set per default usage of Facebook Android SDK v5.5.1 ([Facebook Android SDK changelog](https://github.com/facebook/facebook-android-sdk/blob/master/CHANGELOG.md) | Released: July 29 2019)

Thx [Francesco Tonini](https://github.com/francescotonini) for the PR 👍

<a name="6.0.0"></a>
# [6.0.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v6.0.0)

## Breaking change

* **iOS:** use the [CocoaPods dependency manager](https://cocoapods.org) in order to satisfy the iOS Facebook SDK library dependencies ([#639](https://github.com/jeduan/cordova-plugin-facebook4/issues/639))

### Notes

See [iOS documentation](https://github.com/jeduan/cordova-plugin-facebook4/tree/master/docs/ios) for some notes about installation with Cocoapods.

## Features

* **iOS:** Update Facebook iOS SDK v5.2.3 ([Facebook iOS SDK changelog](https://github.com/facebook/facebook-objc-sdk/blob/master/CHANGELOG.md) | Released: July 15 2019)
* **Android:** Set per default usage of Facebook Android SDK v5.2.0 ([Facebook Android SDK changelog](https://github.com/facebook/facebook-android-sdk/blob/master/CHANGELOG.md) | Released: July 29 2019)

<a name="5.0.0"></a>
# [5.0.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v5.0.0)

## Features

* **iOS:** Update Facebook iOS SDK v5.0.2 ([#751](https://github.com/jeduan/cordova-plugin-facebook4/pull/751) | [Facebook iOS SDK changelog](https://github.com/facebook/facebook-objc-sdk/blob/master/CHANGELOG.md) | Released: June 5 2019)
* **Android:** Set per default usage of Facebook Android SDK v5.0.20 ([#751](https://github.com/jeduan/cordova-plugin-facebook4/pull/751) | [Facebook Android SDK changelog](https://github.com/facebook/facebook-android-sdk/blob/master/CHANGELOG.md) | Released: June 7 2019)

### Kudos
Thx [Guy Lando](https://github.com/guylando) for your amazing work and PR 👍

<a name="4.2.1"></a>
# [4.2.1](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v4.2.1)

## Fix

* **iOS**: fix iOS crash when `enableHybridAppEvents` has already been enabled ([#745](https://github.com/jeduan/cordova-plugin-facebook4/pull/746)) 

### Kudos
Thx [Regev Brody](https://github.com/regevbr) for the PR 👍

<a name="4.2.0"></a>
# [4.2.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v4.2.0)

## Features

* **iOS:** Update Facebook iOS SDK v4.40.0 ([#743](https://github.com/jeduan/cordova-plugin-facebook4/issues/743), [#740](https://github.com/jeduan/cordova-plugin-facebook4/issues/740) | [Facebook iOS SDK changelog](https://developers.facebook.com/docs/ios/change-log-4x) | Released: January 22 2019)
* **Android:** Set per default usage of Facebook Android SDK v4.40.0 ([#743](https://github.com/jeduan/cordova-plugin-facebook4/issues/743), [#740](https://github.com/jeduan/cordova-plugin-facebook4/issues/740) | [Facebook Android SDK changelog](https://developers.facebook.com/docs/android/change-log-4x) | Released: January 22 2019)

<a name="4.1.0"></a>
# [4.1.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v4.1.0)

## Features

* **Facebook:** Allow hybrid apps to send AppEvents from the pixel ([#678](https://github.com/jeduan/cordova-plugin-facebook4/issues/678))

### Kudos

Thx [Mehmet Sencer Karadayi](https://github.com/msencer) for the PR 👍

<a name="4.0.0"></a>
# [4.0.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v4.0.0)

## Features

* **Android:** Support for cordova-android >= v7 without any workaround ([#716](https://github.com/jeduan/cordova-plugin-facebook4/pull/716), [#599](https://github.com/jeduan/cordova-plugin-facebook4/issues/599))

## Breaking change

If you already have the workaround in the `config.xml` of your application, you have to **remove** it respectively you **need** to **remove** the following piece of code of your `config.xml`:

```
<config-file parent="/resources" target="./res/values/strings.xml">		
    <string name="fb_app_id">123456789</string>		
    <string name="fb_app_name">myApplication</string>		
</config-file>
```

### Side notes

Also note that this improvements is backwards compatible, if you use cordova-android < v7 you should still be able to use the plugin.

### Kudos

Thank you [Adrian Pascu](https://github.com/adipascu) for the PR and support 👍

<a name="3.2.0"></a>
# [3.2.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v3.2.0)

## Features

* **iOS:** Update Facebook iOS SDK v4.38.1 ([#725](https://github.com/jeduan/cordova-plugin-facebook4/issues/725) | [Facebook iOS SDK changelog](https://developers.facebook.com/docs/ios/change-log-4x) | Released: 1st November 2018)
* **Android:** Set per default usage of Facebook Android SDK v4.38.1 ([#725](https://github.com/jeduan/cordova-plugin-facebook4/issues/725) | [Facebook Android SDK changelog](https://developers.facebook.com/docs/android/change-log-4x) | Released: 1st November 2018)

<a name="3.1.0"></a>
# [3.1.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v3.1.0)

## Features

* **iOS:** Update Facebook iOS SDK v4.37.0 ([#713](https://github.com/jeduan/cordova-plugin-facebook4/issues/713) | [Facebook iOS SDK changelog](https://developers.facebook.com/docs/ios/change-log-4x) | Released: 27th September 2018)
* **Android:** Set per default usage of Facebook Android SDK v4.37.0 ([#713](https://github.com/jeduan/cordova-plugin-facebook4/issues/713) | [Facebook Android SDK changelog](https://developers.facebook.com/docs/android/change-log-4x) | Released: 27th September 2018)

<a name="3.0.0"></a>
# [3.0.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v3.0.0)

## Features

* **Android:** Update Facebook Android SDK reference to v4.36.0 (drop greedy v4.+ reference) ([#708](https://github.com/jeduan/cordova-plugin-facebook4/issues/708))

### Disclaimer

This release does not contains that much but we bumped up it to a major release because as of now, each release will always be published with a synchronized Facebook SDK version for iOS and for Android 

<a name="2.5.0"></a>
# [2.5.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v2.5.0)

## Breaking change

* **Android:** `ANDROID_SDK_VERSION` was renamed to `FACEBOOK_ANDROID_SDK_VERSION` to avoid misunderstood. This variable is use to set the Facebook SDK version for Android not the Android SDK version ([#706](https://github.com/jeduan/cordova-plugin-facebook4/issues/706))

## Documentation

* **Doc:** Add a note in the `README` regarding the Graph API version which is not set by the plugin itself

<a name="2.4.0"></a>
# [2.4.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v2.4.0)

## Features

* **iOS:** Update Facebook iOS SDK v4.36.0 ([e5c3aba](https://github.com/jeduan/cordova-plugin-facebook4/commit/e5c3abafca2fb0fe6651ab4025cb0510735fb66b) | [Facebook changelog](https://developers.facebook.com/docs/ios/change-log-4x) | Released: 30th August 2018)

<a name="2.3.0"></a>
# [2.3.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v2.3.0)

## Features

* **iOS:** Update Facebook iOS SDK v4.35.0 ([4bdddc9](https://github.com/jeduan/cordova-plugin-facebook4/commit/4bbddc9938f2b087472757723ede1d037182b9c6) | [Facebook changelog](https://developers.facebook.com/docs/ios/change-log-4x) | Released: 26th July 2018)

<a name="2.2.0"></a>
# [2.2.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v2.2.0)

## Features

* **iOS:** Update Facebook iOS SDK v4.34.0 ([74bccb1](https://github.com/jeduan/cordova-plugin-facebook4/commit/74bccb1a4f8938024002d0f4e681b9a56b1d7f43) | [Facebook changelog](https://developers.facebook.com/docs/ios/change-log-4x))

<a name="2.1.0"></a>
# [2.1.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v2.1.0)

## Features

* **iOS:** Update of the Facebook SDK v4.33.0 for iOS 11 ([#653](https://github.com/jeduan/cordova-plugin-facebook4/issues/653))

<a name="2.0.1"></a>
# [2.0.1](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v2.0.1)

## Bug fixes

* **Android:** Fix null pointer exception leading to app crashing after a second login (flow example: login -> graphApi -> logout -> login -> crash) ([#568](https://github.com/jeduan/cordova-plugin-facebook4/issues/568))

<a name="2.0.0"></a>
# [2.0.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v2.0.0)

**Breaking change:** As of February 5, 2018, Facebook doesn't support anymore App Invites, therefore these methods have been removed.
 
This version introduce also a new optional variable for the Android installation.

## Features

* **iOS:** App Invites support removed ([#645](https://github.com/jeduan/cordova-plugin-facebook4/issues/645))

* **Android:** Add optional installation variable `ANDROID_SDK_VERSION` ([#550](https://github.com/jeduan/cordova-plugin-facebook4/issues/550))([#646](https://github.com/jeduan/cordova-plugin-facebook4/pull/646))

### Side note

I did consider removing the methods for App Invites as a breaking change, even if these weren't already supported from Facebook since months.

I followed the semantic versioning idea the Ionic team recently published in their [blog](https://blog.ionicframework.com/ionic-semantic-versioning-release-schedule-and-lts/)

@peterpeterparker

<a name="1.10.1"></a>
# [1.10.1](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v1.10.1)

v1.10.1 Fix an issue regarding the versioning (v1.10 was missing in plugin.xml)

<a name="1.10.0"></a>
# [1.10.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v1.10.0)

v1.10.0 introduces the last Facebook SDK for iOS

## Features

* **iOS:** Update of the Facebook SDK v4.31.1 for iOS 11 ([#631](https://github.com/jeduan/cordova-plugin-facebook4/issues/631)) ([#634](https://github.com/jeduan/cordova-plugin-facebook4/pull/634))

* **Android:** Add a note in the README and Android Guide about the compatibility with cordova-android >= v7.0.0

### Disclaimer 

The introduction of the new Facebook SDK for iOS 11 add a new confirm modal to the login flow.

This is the expected design flow defined by `Apple` which `Facebook` implemented. The `cordova-plugin-facebook4` can't modify this behavior (as far as I know, @peterpeterparker).

#### iOS 11.3

On iOS 11.3, the user won't have the choice anymore between using the Facebook App or using Email/Phone number for Facebook login process but will go straight to the "Facebook - Accept permissions" screen.

Therefore, with this version, the user will still face only one modal during the login flow.

#### iOS >= 11 < 11.3

Because of the introduction of the new modal, the user might face two modals during the login flow. One asking him/her if he/she want to open Facebook and one again asking him/her as before if he/she want to open the Facebook App.

About the subject, you could for example have a look to this [stackoverflow's post](https://stackoverflow.com/questions/45858774/ios-11-facebook-signin-is-showing-an-initial-system-alert/).

This is improved with iOS 11.3.
