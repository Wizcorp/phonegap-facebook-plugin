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
