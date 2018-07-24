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
