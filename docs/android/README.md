# Facebook Requirements and Set-Up [Android]

To use this plugin you will need to make sure you've registered your Facebook app with Facebook and have an APP_ID (https://developers.facebook.com/apps).

If you plan on rolling this out on Android, please note that you will need to [generate a hash of your Android key(s) and submit those to the Developers page on Facebook](https://developers.facebook.com/docs/android/getting-started) to get it working. Furthermore, if you are generating this hash on Windows (specifically 64 bit versions), please use version 0.9.8e or 0.9.8d of [OpenSSL for Windows](http://code.google.com/p/openssl-for-windows/downloads/list) and *not* 0.9.8k. Big ups to [fernandomatos](http://github.com/fernandomatos) for pointing this out!

## Install

This plugin requires [Cordova CLI](https://cordova.apache.org/docs/en/5.0.0/guide_cli_index.md.html)

To install the plugin in your app, execute the following (replace variables where necessary):
```sh
# Create initial Cordova app
$ cordova create myApp
$ cd myApp/
$ cordova platform add android

# Remember to replace APP_ID and APP_NAME variables
$ cordova plugin add https://github.com/jeduan/cordova-plugin-facebook4 --save --variable APP_ID="123456789" --variable APP_NAME="myApplication"
```

You can now use the plugin right away

### Older Cordova CLI

In order to be compatible with older Cordova CLI version than v7, the property `ANDROID_SDK_VERSION` has to be specified in the config.xml (because otherwise it won't pick the default value, see [#650](https://github.com/jeduan/cordova-plugin-facebook4/issues/650)).

You could add the property manually or specify it when you install the plugin, see the cmd below in section "In case of conflict"

Of course if you could, you could update your Cordova CLI and avoid specifying explicitly this option

### cordova-android >= 7

In order to install correctly this plugin for `cordova-android` v7.x.y and above, you have to specify the APP_ID and APP_NAME in the android `platform` tag of your `config.xml`

    <config-file parent="/resources" target="./res/values/strings.xml">
        <string name="fb_app_id">123456789</string>
        <string name="fb_app_name">myApplication</string>
    </config-file>

### In case of conflict

If you would face conflicts with other plugins use in your project while installing `cordova-plugin-facebook4`, you would be able to specify a specific Android SDK version while using the variable `ANDROID_SDK_VERSION`

Important note: Use this option at **your own risk**

```sh
$ cordova plugin add https://github.com/jeduan/cordova-plugin-facebook4 --save --variable APP_ID="123456789" --variable APP_NAME="myApplication" --variable ANDROID_SDK_VERSION="X.YY.Z"
```

where `X.YY.Z` could be for example 4.25.0