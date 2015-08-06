// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved.
// Licensed under the Apache License, Version 2.0.
// See LICENSE in the project root for license information.

var exec = require("cordova/exec");
var FB_REDIRECT_URI = "https://www.facebook.com/connect/login_success.html";

/**
 * Method for displaying custom web dialogs using InAppBrowser
 * component, which handles redirection to specified URL.
 *
 * @param  {String} startUri      An URI to open
 * @param  {String} redirectUri   URI, that will be passed to successCallback when
 *                                dialog will be redirected to it
 * @param  {Function} successCB   A success callback that accepts a target URI for this dialog
 * @param  {Function} errorCB     An errorCallback. Currently being called only when dialog is closed by user.
 */
var showWebDialog = function(startUri, redirectUri, successCB, errorCB) {

    var dialog = window.open(startUri, '_blank', 'hidden=yes');
    var closeHandler = function () {
        errorCB('Dialog is closed by user');
    };
    var redirectHandler = function (e) {
        if (e.url.indexOf(redirectUri) === 0) {
            dialog.removeEventListener('exit', closeHandler);
            dialog.close();
            successCB(e.url);
        }
    };
    var loadedHandler = function () {
        dialog.show();
    };

    dialog.addEventListener('loadstart', redirectHandler);
    dialog.addEventListener('loadstop', loadedHandler);
    dialog.addEventListener('exit', closeHandler);
};

var facebookConnectPlugin = {

    getLoginStatus: function (s, f) {
        exec(s, f, "FacebookConnectPlugin", "getLoginStatus", []);
    },

    showDialog: function (options, s, f) {
        var method = options.method;
        if (!method) {
            f('Dialog method should be specified');
            return;
        }

        // WP8 JsonHelper is not able to deserialize an arbitrary JSON object
        // so we need to transform dialog options to array of key/value pairs
        var convertedOpts = [];
        for (var option in options) {
            if (options.hasOwnProperty(option)) {
                convertedOpts.push({ name: option, value: options[option] });
            }
        }

        // a success handler which gets a dialog URI, generated
        // by native proxy and displays a web dialog using that URI
        var gotDialogUri = function (dialogUri) {
            showWebDialog(dialogUri, FB_REDIRECT_URI, function (responseUri) {
                // When dialog is being redirected to target URI
                // try to fetch target uri on native side
                exec(function (resultItems) {
                    if (s) {
                        // This handler is required, since Json serializer in WP8 returns JSON from API in form of
                        // [{Key: <property_name>, Value: <property_value>}...] instead of raw object.
                        var result = {};
                        resultItems.forEach(function(item) {
                            result[item.Key] = item.Value;
                        });
                        s(result);
                    }
                }, f, "FacebookConnectPlugin", "fetchResponseUri", [method, responseUri]);
            }, f);
        };

        exec(gotDialogUri, f, "FacebookConnectPlugin", "getDialogUri", [method, [], FB_REDIRECT_URI, convertedOpts]);
    },

    login: function (permissions, s, f) {
        // a success handler which gets a login dialog URI, generated
        // by native proxy and displays a web dialog using that URI
        var gotLoginUri = function (loginUri) {
            showWebDialog(loginUri, FB_REDIRECT_URI, function(responseUri) {
                // When login is succeeds, try to fetch target uri on native side
                exec(s, f, "FacebookConnectPlugin", "fetchResponseUri", ['login', responseUri]);
            }, f);
        };

        exec(gotLoginUri, f, "FacebookConnectPlugin", "getDialogUri", ["login", permissions, FB_REDIRECT_URI]);
    },

    logEvent: function(name, params, valueToSum, s, f) {
        f("logEvent method is not supported on WP8. Use graph API for that");
    },

    logPurchase: function(value, currency, s, f) {
        f("LogPurchase method is not supported on WP8. Use graph API for that");
    },

    getAccessToken: function(s, f) {
        exec(s, f, "FacebookConnectPlugin", "getAccessToken", []);
    },

    logout: function (s, f) {
        exec(s, f, "FacebookConnectPlugin", "logout", []);
    },

    api: function (graphPath, permissions, s, f) {
        if (!permissions) { permissions = []; }

        var fail = function(err) {
            // In case of error we need to check if error is caused by insufficient permissions
            // If so, we need to raise custom dialog for acquiring missing permissions
            if (!err.code || err.code !== "permissions_missing") f && f(err);
            showWebDialog(err.permissions_uri, FB_REDIRECT_URI, function(responseUri) {
                exec(function() {
                    // If missing permissions acquired, re-run proxy method again
                    exec(s, f, "FacebookConnectPlugin", "graphApi", [graphPath, permissions]);
                }, f, "FacebookConnectPlugin", "fetchResponseUri", ['login', responseUri]);
            }, f.bind(null, err));
        };

        exec(s, fail, "FacebookConnectPlugin", "graphApi", [graphPath, permissions]);
    }
};

module.exports = facebookConnectPlugin;
