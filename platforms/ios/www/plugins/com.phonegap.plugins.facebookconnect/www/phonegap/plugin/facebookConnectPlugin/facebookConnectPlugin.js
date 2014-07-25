cordova.define("com.phonegap.plugins.facebookconnect.FacebookConnectPlugin", function(require, exports, module) {/*
 * @author Ally Ogilvie
 * @copyright Wizcorp Inc. [ Incorporated Wizards ] 2014
 * @file - facebookConnectPlugin.js
 * @about - JavaScript interface for PhoneGap bridge to Facebook Connect SDK
 *
 *
 */

var exec = require("cordova/exec");

var facebookConnectPlugin = {

    getLoginStatus: function (s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "getLoginStatus", []);
    },

    showDialog: function (options, s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "showDialog", [options]);
    },

    login: function (permissions, s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "login", permissions);
    },

    logEvent: function(name, params, valueToSum, s, f) {
        // Prevent NSNulls getting into iOS, messes up our [command.argument count]
        if (!params && !valueToSum) {
            cordova.exec(s, f, "FacebookConnectPlugin", "logEvent", [name]);
        } else if (params && !valueToSum) {
            cordova.exec(s, f, "FacebookConnectPlugin", "logEvent", [name, params]);
        } else if (params && valueToSum) {
            cordova.exec(s, f, "FacebookConnectPlugin", "logEvent", [name, params, valueToSum]);
        } else {
            f("Invalid arguments");
        }
    },

    logPurchase: function(value, currency, s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "logPurchase", [value, currency]);
    },

    getAccessToken: function(s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "getAccessToken", []);
    },

    logout: function (s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "logout", []);
    },

    api: function (graphPath, permissions, s, f) {
        if (!permissions) permissions = [];
        cordova.exec(s, f, "FacebookConnectPlugin", "graphApi", [graphPath, permissions]);
    }

};

module.exports = facebookConnectPlugin;
});
