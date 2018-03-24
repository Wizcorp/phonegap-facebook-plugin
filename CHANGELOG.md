<a name="2.0.0"></a>
# [2.0.0](https://github.com/jeduan/cordova-plugin-facebook4/releases/tag/v2.0.0) (Not released yet)

v2.0.0 introduces the last Facebook SDK for iOS and improves the support for cordova-android >= 7.0.0

## Features

* **iOS:** Update of the Facebook SDK v4.31.1 for iOS 11 ([#631](https://github.com/jeduan/cordova-plugin-facebook4/issues/631)) ([#634](https://github.com/jeduan/cordova-plugin-facebook4/pull/634))

* **Android:** *TODO - Not yet merged and documented* 

### Disclaimer 

The introduction of the new Facebook SDK for iOS 11 add a new additional confirm modal to the login flow. 

This is an intented design flow defined by `Apple` which `Facebook` implemented. The `cordova-plugin-facebook4` can't modify this behavior (as far as I know, @peterpeterparker).

To know more about the subject, you could for example have a look to this [stackoverflow's post](https://stackoverflow.com/questions/45858774/ios-11-facebook-signin-is-showing-an-initial-system-alert/).
  