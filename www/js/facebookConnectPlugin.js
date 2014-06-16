/*
 * @author Ally Ogilvie
 * @copyright Wizcorp Inc. [ Incorporated Wizards ] 2014
 * @file - facebookConnectPlugin.js
 * @about - JavaScript interface for PhoneGap bridge to Facebook Connect SDK
 *
 *
 */

if (!window.cordova) {
// This should override the existing facebookConnectPlugin object created from cordova_plugins.js
    var facebookConnectPlugin = {

        getLoginStatus: function (s, f) {
            // Try will catch errors when SDK has not been init
            try {
                FB.getLoginStatus(function (response) {
                    s(response.status);
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
            if (!options.caption) {
                options.caption = "";
            }
            if (!options.description) {
                options.description = "";
            }
            if (!options.link) {
                options.link = "";
            }
            if (!options.picture) {
                options.picture = "";
            }
            
            // Try will catch errors when SDK has not been init
            try {
                FB.ui({
                    method: options.method,
                    name: options.name,
                    caption: options.caption,
                    description: (
                        options.description
                    ),
                    link: options.link,
                    picture: options.picture
                },
                function (response) {
                    if (response && response.post_id) {
                        s({ post_id: response.post_id });
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
            var permissionObj = {};
            if (permissions && permissions.length > 0) {
                permissionObj.scope = permissions.toString();
            }
            
            FB.login(function (response) {
                if (response.authResponse) {
                    s(response);
                } else {
                    f(response.status);
                }
            }, permissionObj);
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

        logout: function (s, f) {
            // Try will catch errors when SDK has not been init
            try {
                FB.logout( function (response) {
                    s(response);
                })
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
                xfbml      : true,
                version    : version
            })
        }
    };
    
    // Bake in the JS SDK
    (function () {
        console.log("launching FB SDK")
        var e = document.createElement('script');
        e.src = document.location.protocol + '//connect.facebook.net/en_US/sdk.js';
        e.async = true;
        document.getElementById('fb-root').appendChild(e);
    }());

}
