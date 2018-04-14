<a name="1.10.0"></a>
# [1.10.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v1.10.0) (Not released yet)

v1.10.0 introduces the last Facebook SDK for iOS

## Features

* **iOS:** Update of the Facebook SDK v4.31.1 for iOS 11 ([#631](https://github.com/jeduan/cordova-plugin-facebook4/issues/631)) ([#634](https://github.com/jeduan/cordova-plugin-facebook4/pull/634))

* **Android:** Add a note in the README and Android Guide about the compatibility with cordova-android >= v7.0.0

### Disclaimer 

The introduction of the new Facebook SDK for iOS 11 add a new additional confirm modal to the login flow. 

This is the expected design flow defined by `Apple` which `Facebook` implemented. The `cordova-plugin-facebook4` can't modify this behavior (as far as I know, @peterpeterparker).

To know more about the subject, you could for example have a look to this [stackoverflow's post](https://stackoverflow.com/questions/45858774/ios-11-facebook-signin-is-showing-an-initial-system-alert/).

#### Installing previous version of the plugin

If you mind having an additional popup in your login flow and as long as `Apple` which `Facebook` don't make this upgrade mandatory, you could stick, if you want, your choice, to the previous version of the plugin by specifying it's previous version number when you install it:

     cordova plugin add cordova-plugin-facebook4@1.9.1 --save --variable APP_ID="123456789" --variable APP_NAME="myApplication"
  