// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved.
// Licensed under the Apache License, Version 2.0.
// See LICENSE in the project root for license information.

/*global Windows, WinJS, require*/

var APPLICATION_ID, APPLICATION_NAME;

/**
 * Initialize APPLICATION_ID and APPLICATION_NAME variables here
 * These parameters is being added to config.xml during plugin installation.
 */
(function() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(e) {
        if (e.target.readyState === 4) {
            if (200 <= e.target.status < 300) {
                var config = new DOMParser();
                var preferences = config.parseFromString(e.target.responseText, "application/xml").getElementsByTagName("preference");
                for (var i = 0; i < preferences.length; i++) {
                    var preference = preferences[i];
                    if (preference.getAttribute('name') === 'FacebookAppID') {
                        APPLICATION_ID = preference.getAttribute('value');
                    }
                    if (preference.getAttribute('name') === 'FacebookAppName') {
                        APPLICATION_NAME = preference.getAttribute('value');
                    }
                }
                if (!APPLICATION_ID || !APPLICATION_NAME) {
                    throw new Error('Failed to load facebook application preferences');
                }
            } else {
                throw new Error('Failed to load facebook application preferences');
            }
        }
    };
    // Need to do a sync XHR because APPLICATION_ID and  APPLICATION_NAME
    // variables need to be initialized before fbClient is being created
    xhr.open('GET', '../config.xml', false);
    xhr.send();
})();

var FB_GRAPH_URL = 'https://graph.facebook.com/',
    FB_DIALOG_URL = 'https://www.facebook.com/dialog/',
    FB_REDIRECT_URL = 'https://www.facebook.com/connect/login_success.html',
    FB_DIALOG_TYPE = 'popup';

var Session = require('./FacebookSession');

/**
 * Method for constructing url from its parts
 * @param  {String} baseUrl Base path of url
 * @param  {String} relUrl  Additional part of url
 * @param  {Object} params  An set of param:value pairs that will be transformed
 *                              into query string and appended to result URL.
 *                              Values will be escaped if necessary.
 * @return {String}         Composed URL
 */
var createUrl = function (baseUrl, relUrl, params) {
    var res = new Windows.Foundation.Uri(baseUrl, relUrl).rawUri;
    var queryArray = [];
    for (var param in params) {
        if (params.hasOwnProperty(param)) {
            queryArray.push(param + '=' + encodeURIComponent(params[param]));
        }
    }
    var query = queryArray.join('&');
    return res + '?' + query;
};


/**
 * Parses url and returns an object that contains a fragment of URL
 * and query, transformed to key-value pairs
 * @param  {String} url Url to parse
 * @return {Object}     An object with fragment and query fields
 */
var parseQuery = function (url) {
    var u = Windows.Foundation.Uri(url);
    var query = null;
    var parsedQuery = u.queryParsed;
    if (parsedQuery.size > 0) {
        query = {};
        for (var item in parsedQuery) {
            if (parsedQuery.hasOwnProperty(item)) {
                query[parsedQuery[item].name] = parsedQuery[item].value;
            }
        }
    }
    return { fragment: u.fragment, query: query };
};

/**
 * Helper method that provides shared logic for displaying specified URL
 * and handling redirects to specified callback URL
 * @param  {String} dialogUrl   Uri for dialog to show
 * @param  {String} callbackUrl Uri, that will be caught by method and sent to success callback
 * @param  {Function} successCB   Callback that handles a callback URL
 * @param  {Function} closeCB     Callback that will be fired when user closes dialog
 */
var showWebDialog = function(dialogUrl, callbackUrl, successCB, errorCB) {

    var dialog = window.open(dialogUrl, '_blank', 'location=no,hidden=yes');
    var closeHandler = function () {
        errorCB('Dialog closed by user');
    };
    var redirectHandler = function(e) {
        if (e.url.indexOf(callbackUrl) === 0) {
            dialog.close();
            var result = parseQuery(e.url);
            // TODO: Add comments for this logic
            if (result.query && result.query.error_code) {
                errorCB(result.query);
                return;
            }
            // TODO: Add comments for this logic
            if (result.fragment && result.fragment === '#_=_' && !result.query) {
                closeHandler();
                return;
            }
            successCB(result);
        }
    };
    var loadedHandler = function() {
        dialog.show();
    };

    dialog.addEventListener('loadstart', redirectHandler);
    dialog.addEventListener('loadstop', loadedHandler);
    dialog.addEventListener('exit', closeHandler);
};

/**
 * Facebook client constructor
 * @param {String} appId Facebook application ID.
 * Can be found at your's application page.
 * See https://developers.facebook.com/apps
 */
var FacebookClient = function(appId) {
    this.session = new Session(appId);
    return this;
};

/**
 * Requests additional Facebook permissions if necessary.
 * Compares already requested permissions with provided ones
 * and if new permissions required shows Facebook permissions dialog.
 * @param  {@function} successCB   Success callback
 * @param  {@function} errorCB     Error callback
 * @param  {string} permissions    Comma-delimited list of permissions required
 */
FacebookClient.prototype.requestPermissions = function(successCB, errorCB, permissions) {

    var callbackUrl = FB_REDIRECT_URL,
        requestPermissionUrl = createUrl(FB_DIALOG_URL, 'oauth', {
            client_id: APPLICATION_ID,
            redirect_uri: callbackUrl,
            auth_type: 'rerequest',
            response_type: 'token,granted_scopes',
            display: FB_DIALOG_TYPE,
            scope: permissions
        });

    var self = this;

    showWebDialog(requestPermissionUrl, callbackUrl, function (result) {

        var tokenQuery = new Windows.Foundation.WwwFormUrlDecoder(result.fragment);
        var token = tokenQuery.getFirstValueByName('#access_token');

        var expiresIn = new Date();
        expiresIn.setSeconds(expiresIn.getSeconds() + tokenQuery.getFirstValueByName('expires_in'));

        var permissions = tokenQuery.getFirstValueByName('granted_scopes');

        // Set up new session here
        self.session.set({
            active: true,
            accessToken: token,
            permissions: permissions,
            expiresIn: expiresIn
        });

        self.getLoginStatus(successCB, errorCB);
    }, errorCB);
};

FacebookClient.prototype.login = function (successCB, errorCB, args) {

    var self = this;
    var permissions = (args || []).join(',');

    if (!this.session.isExpired()) {
        // Session already active, just check the permissions here
        if (this.session.needNewPermissions(permissions)) {
            // if new permissions passed, request them
            this.requestPermissions(function () {
                self.getLoginStatus(successCB, errorCB);
            }, errorCB, permissions);
        } else {
            this.getLoginStatus(successCB, errorCB);
        }
    } else {
        // No active session found, need to authenticate
        var redirectUri = FB_REDIRECT_URL,
            authUri = createUrl(FB_DIALOG_URL, 'oauth', {
                client_id: APPLICATION_ID,
                redirect_uri: redirectUri,
                scope: permissions,
                response_type: 'token,granted_scopes',
                display: FB_DIALOG_TYPE
            });

        showWebDialog(authUri, redirectUri, function(result) {

            var tokenQuery = new Windows.Foundation.WwwFormUrlDecoder(result.fragment);
            var token = tokenQuery.getFirstValueByName('#access_token');

            var expiresIn = new Date();
            expiresIn.setSeconds(expiresIn.getSeconds() + tokenQuery.getFirstValueByName('expires_in'));

            var permissions = tokenQuery.getFirstValueByName('granted_scopes');

            // Set up new session here
            self.session.set({
                active: true,
                accessToken: token,
                permissions: permissions,
                expiresIn: expiresIn
            });

            self.getLoginStatus(successCB, errorCB);
        }, errorCB);
    }
};

FacebookClient.prototype.logout = function (successCB, errorCB) {
    // Doesn't really log out app from facebook, just clears session
    if (!this.session.isExpired()) {
        this.session.destroy();
        successCB();
    } else {
        errorCB("Session is either not opened or expired");
    }
};

FacebookClient.prototype.getLoginStatus = function (successCB /*, errorCB*/) {

    if (this.session.isExpired()) {
        successCB({ status: "unknown" });
    } else {
        var response = {
            status: "connected",
            authResponse: {
                accessToken: this.session.accessToken,
                expiresIn: this.session.expiresIn,
                session_key: true,
                sig: "..."
            }
        };

        if (this.session.userID) {
            response.userID = this.session.userID;
            successCB(response);
        } else {
            // If userID is not defined, fetch it from Facebook Graph API
            var self = this;
            this.graphApi(function (userData) {
                self.session.userID = userData.data.user_id;
                response.userID = self.session.userID;
                successCB(response);
            }, function (/*error*/) {
                // No need to fail here, just return a response object without userID
                successCB(response);
            }, ['debug_token?input_token=' + this.session.accessToken ]);
        }
    }
};

FacebookClient.prototype.getAccessToken = function (successCB, errorCB) {
    if (!this.session.isExpired()) {
        successCB(this.session.accessToken);
    } else {
        errorCB("Session is either not opened or expired");
    }
};

FacebookClient.prototype.graphApi = function (successCB, errorCB, args) {

    // "In order to make calls to the Graph API on behalf of a user,
    //  the user has to be logged into your app using Facebook login."
    // So really we don't need to check access token every time,
    // especially if graph call goes from application, not user.
    // if (this.session.isExpired()) { errorCB(); return; }

    var path = args[0];
    var requestUrl = FB_GRAPH_URL + path + '&access_token=' + this.session.accessToken;
    var permissions = (args[1] || []).join(',');

    // Check for permissions first
    if (this.session.needNewPermissions(permissions)) {
        // if new permissions passed, request them
        this.requestPermissions(function () {
            executeRequest(requestUrl);
        }, errorCB, permissions);
    } else {
        // then execute request
        executeRequest(requestUrl);
    }

    // sample request: "me/?fields=id,email"
    function executeRequest(url) {
        WinJS.xhr({ type: 'GET', url: url }).then(function (req) {
            successCB(JSON.parse(req.response));
        }, function(req) {
            errorCB(JSON.parse(req.response));
        });
    }
};

FacebookClient.prototype.showDialog = function(successCB, errorCB, args) {
    var options = args[0] || {};

    var method = options.method;
    if (!method) {
        errorCB('Dialog method should be specified');
        return;
    }

    // DOCS: https://developers.facebook.com/docs/web/share#linksharedialog
    // Example: https://www.facebook.com/dialog/share?app_id=145634995501895
    //          &display=popup&href=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2F
    //          &redirect_uri=https%3A%2F%2Fdevelopers.facebook.com%2Ftools%2Fexplorer

    var redirectUrl = FB_REDIRECT_URL;

    // Common query parameters that should be passed to FB API
    var urlParams = {
        app_id: APPLICATION_ID,
        access_token: this.session.accessToken,
        redirect_uri: redirectUrl,
        display: FB_DIALOG_TYPE
    };

    // Extend and override common parameters by new ones provided by user.
    // For available options see
    //      https://developers.facebook.com/docs/sharing/reference/feed-dialog/v2.0 and
    //      https://developers.facebook.com/docs/sharing/reference/share-dialog
    for (var opt in options) {
        if (options.hasOwnProperty(opt)) {
            urlParams[opt] = options[opt];
        }
    }

    var popupUrl = createUrl(FB_DIALOG_URL, method, urlParams);

    showWebDialog(popupUrl, redirectUrl, function(result) {
        successCB(result.query);
    }, errorCB);
};

var fbClient = new FacebookClient(APPLICATION_ID);

var api = {
    login: function (successCB, errorCB, args) {
        fbClient.login(successCB, errorCB, args);
    },
    logout: function (successCB, errorCB) {
        fbClient.logout(successCB, errorCB);
    },
    getLoginStatus: function (successCB, errorCB) {
        fbClient.getLoginStatus(successCB, errorCB);
    },
    getAccessToken: function (successCB, errorCB) {
        fbClient.getAccessToken(successCB, errorCB);
    },
    graphApi: function (successCB, errorCB, args) {
        fbClient.graphApi(successCB, errorCB, args);
    },
    showDialog: function (successCB, errorCB, args) {
        fbClient.showDialog(successCB, errorCB, args);
    },
    logEvent: function (successCB) {
        // AppEvents are not avaliable in JS.
        successCB();
    },
    logPurchase: function (successCB) {
        // AppEvents are not avaliable in JS.
        successCB();
    },
};

require("cordova/exec/proxy").add("FacebookConnectPlugin", api);
