"use strict";

/*
 * @author Ally Ogilvie
 * @copyright Wizcorp Inc. [ Incorporated Wizards ] 2014
 * @file - facebookConnectPlugin.js
 * @about - JavaScript interface for PhoneGap bridge to Facebook Connect SDK
 *
 *
 */

if (cordova.platformId == "browser") {

    var facebookConnectPlugin = {

        getLoginStatus: function (s, f) {
            // Try will catch errors when SDK has not been init
            try {
                FB.getLoginStatus(function (response) {
                    s(response);
                });
            } catch (error) {
                if (!f) {
                    console.error(error.message);
                } else {
                    f(error.message);
                }
            }
        },

        showDialog: function (options, s, f) {

            if (!options.name) {
                options.name = "";
            }
            if (!options.message) {
                options.message = "";
            }
            if (!options.caption) {
                options.caption = "";
            }
            if (!options.description) {
                options.description = "";
            }
            if (!options.href) {
                options.href = "";
            }
            if (!options.picture) {
                options.picture = "";
            }
            if (options.link && !options.href) {
                options.href = options.link;
            }
            
            // Try will catch errors when SDK has not been init
            try {
                FB.ui(options,
                function (response) {
                    if (response && (response.request || !response.error_code)) {
                        s(response);
                    } else {
                        f(response);
                    }
                });
            } catch (error) {
                if (!f) {
                    console.error(error.message);
                } else {
                    f(error.message);
                }
            }
        },
        // Attach this to a UI element, this requires user interaction.
        login: function (permissions, s, f) {
            // JS SDK takes an object here but the native SDKs use array.
            var options = {};
            if (permissions && permissions.length > 0) {
                var index = permissions.indexOf('rerequest');
                if (index > -1) {
                    permissions.splice(index, 1);
                    options.auth_type = 'rerequest';
                }
                options.scope = permissions.toString();
            }
            
            FB.login(function (response) {
                if (response.authResponse) {
                    s(response);
                } else {
                    f(response.status);
                }
            }, options);
        },

        getAccessToken: function (s, f) {
            var response = FB.getAccessToken();
            if (!response) {
                if (!f) {
                    console.error("NO_TOKEN");
                } else {
                    f("NO_TOKEN");
                }
            } else {
                s(response);
            }
        },

        logEvent: function (eventName, params, valueToSum, s, f) {
            // AppEvents are not avaliable in JS.
            s();
        },

        logPurchase: function (value, currency, s, f) {
            // AppEvents are not avaliable in JS.
            s();
        },

        logout: function (s, f) {
            // Try will catch errors when SDK has not been init
            try {
                FB.logout( function (response) {
                    s(response);
                });
            } catch (error) {
                if (!f) {
                    console.error(error.message);
                } else {
                    f(error.message);
                }
            }
        },

        api: function (graphPath, permissions, s, f) {
            // JS API does not take additional permissions
            
            // Try will catch errors when SDK has not been init
            try {
                FB.api(graphPath, function (response) {
                    if (response.error) {
                        f(response);
                    } else {
                        s(response);
                    }
                });
            } catch (error) {
                if (!f) {
                    console.error(error.message);
                } else {
                    f(error.message);
                }
            }
        },

        // Browser wrapper API ONLY
        browserInit: function (appId, version) {
            if (!version) {
                version = "v2.0";
            }
            FB.init({
                appId      : appId,
                cookie     : true,
                xfbml      : true,
                version    : version
            });
        }
    };
    
    // Bake in the JS SDK
    (function () {
        // Retrieve the root element to append the script tags to
        var root = document.getElementById('fb-root') || document.getElementsByTagName('body')[0];

        if (!window.FB) {
            console.log("launching FB SDK");
            var e = document.createElement('script');
            e.async = true;
            e.src = document.location.protocol + '//connect.facebook.net/en_US/sdk.js';
            e.onerror = onSDKError;

            root.appendChild(e);
        }

        /**
         * If an error occurs, show it in the console.
         */
        function onSDKError(e) {
            console.error('Could not load the Facebook SDK.', e);
        }
    }());

    module.exports = facebookConnectPlugin;

} else {

    var exec = require("cordova/exec");

    var facebookConnectPlugin = {

        getLoginStatus: function (s, f) {
            exec(s, f, "FacebookConnectPlugin", "getLoginStatus", []);
        },

        showDialog: function (options, s, f) {
            if (!options.link && options.href) {
                options.link = options.href;
            }
            exec(s, f, "FacebookConnectPlugin", "showDialog", [options]);
        },

        login: function (permissions, s, f) {
            exec(s, f, "FacebookConnectPlugin", "login", permissions);
        },

        logEvent: function(name, params, valueToSum, s, f) {
            // Prevent NSNulls getting into iOS, messes up our [command.argument count]
            if (!params && !valueToSum) {
                exec(s, f, "FacebookConnectPlugin", "logEvent", [name]);
            } else if (params && !valueToSum) {
                exec(s, f, "FacebookConnectPlugin", "logEvent", [name, params]);
            } else if (params && valueToSum) {
                exec(s, f, "FacebookConnectPlugin", "logEvent", [name, params, valueToSum]);
            } else {
                f("Invalid arguments");
            }
        },

        logPurchase: function(value, currency, s, f) {
            exec(s, f, "FacebookConnectPlugin", "logPurchase", [value, currency]);
        },

        getAccessToken: function(s, f) {
            exec(s, f, "FacebookConnectPlugin", "getAccessToken", []);
        },

        logout: function (s, f) {
            exec(s, f, "FacebookConnectPlugin", "logout", []);
        },

        api: function (graphPath, permissions, s, f) {
            if (!permissions) { permissions = []; }
            exec(s, f, "FacebookConnectPlugin", "graphApi", [graphPath, permissions]);
        }
    };

    module.exports = facebookConnectPlugin;
}
