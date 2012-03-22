/* MIT licensed */
// (c) 2011 Dave Johnson, Nitobi
// (c) 2011 Sergey Grebnov
// based on https://github.com/davejohnson/phonegap-plugin-facebook-connect/blob/master/www/pg-plugin-fb-connect.js
// and FBConnect.js (c) 2010 Jesse MacFadyen, Nitobi

PG = ( typeof PG == 'undefined' ? {} : PG );
PG.FB = {
    init: function (apiKey) {
        console.log("fb-connect init");

        // create the fb-root element if it doesn't exist
        if (!document.getElementById('fb-root')) {
            var elem = document.createElement('div');
            elem.id = 'fb-root';
            document.body.appendChild(elem);
        }

        // initializes connection module
        FB.fbConnect = FBConnect.install(apiKey, "http://www.facebook.com/connect/login_success.html", "touch");
        FB.fbConnect.restoreLastSession();

        var session = FB.fbConnect.session;

        if (session && session.expires > new Date().valueOf()) {
            FB.Auth.setSession(session, 'connected');
        }
    },
    login: function (a, b) {
        console.log("fb-connect login");

        FB.fbConnect.connect(b.scope);

        FB.fbConnect.onConnect = function (e) {
            FB.fbConnect.saveSession();
            FB.Auth.setSession(FB.fbConnect.session, 'connected');
            if (a) a(e);
        }
    },
    logout: function (cb) {
        console.log("fb-connect logout");

        FB.fbConnect.logout();

        FB.fbConnect.onDisconnect = function (e) {
            FB.fbConnect.saveSession();
            FB.Auth.setSession(null, 'notConnected');
            if (cb) cb(e);
        }
    },
    getLoginStatus: function (cb) {
        console.log("fb-connect getLoginStatus");

        if (FB.fbConnect.session && FB.fbConnect.session.expires > new Date().valueOf()) {
            FB.fbConnect.status = "connected";
        }
        else {
            FB.fbConnect.status = "unknown";
        }

        if (cb) cb(FB.fbConnect);
    }
};

/**
 * FBConnect implements user authentication logic and session information store
 */

function FBConnect(client_id, redirect_uri, display) {

    this.client_id = client_id;
    this.redirect_uri = redirect_uri;
    this.display = display;
        
    this.resetSession();

    if (window.plugins.childBrowser == null) {
        ChildBrowser.install();
    }

}

/**
* User login
*/
FBConnect.prototype.connect = function (scope) {

    var authorize_url = "https://graph.facebook.com/oauth/authorize?";
    authorize_url += "client_id=" + this.client_id;
    authorize_url += "&redirect_uri=" + this.redirect_uri;
    authorize_url += "&display=" + (this.display ? this.display : "touch");
    authorize_url += "&type=user_agent";

    // extended permissions http://developers.facebook.com/docs/reference/api/permissions/
    if (scope) {
        authorize_url += "&scope=" + scope;
    }

    window.plugins.childBrowser.showWebPage(authorize_url);
    var self = this;
    window.plugins.childBrowser.onLocationChange = function (loc) { self.onLoginLocationChange(loc); };
}

FBConnect.prototype.onLoginLocationChange = function (newLoc) {
    if (newLoc.indexOf(this.redirect_uri) == 0) {
        var result = unescape(newLoc).split("#")[1];
        result = unescape(result);

        // TODO: Error Check
        this.session.access_token = result.split("&")[0].split("=")[1];
        var expiresIn = parseInt(result.split("&")[1].split("=")[1]);
        this.session.expires = new Date().valueOf() + expiresIn * 1000;
        this.status = "connected";

        window.plugins.childBrowser.close();
        this.onConnect(this);

    }
}

/**
* User logout
*/
FBConnect.prototype.logout = function () {
    var authorize_url = "https://www.facebook.com/logout.php?";
    authorize_url += "&next=" + this.redirect_uri;
    authorize_url += "&access_token=" + this.session.access_token;
    console.log("logout url: " + authorize_url);
    window.plugins.childBrowser.showWebPage(authorize_url);
    var self = this;
    window.plugins.childBrowser.onLocationChange = function (loc) {
        console.log("onLogout");
        window.plugins.childBrowser.close();
        self.resetSession();
        self.status = "notConnected";
        self.onDisconnect(this);
    };
}

/**
* Example method - returns your friends
*/
FBConnect.prototype.getFriends = function () {
    var url = "https://graph.facebook.com/me/friends?access_token=" + this.session.access_token;
    var req = new XMLHttpRequest();

    req.open("get", url, true);
    req.send(null);
    req.onerror = function () { alert("Error"); };
    return req;
}

// Note: this plugin does NOT install itself, call this method some time after deviceready to install it
// it will be returned, and also available globally from window.plugins.fbConnect
FBConnect.install = function (client_id, redirect_uri, display) {
    if (!window.plugins) {
        window.plugins = {};
    }
    window.plugins.fbConnect = new FBConnect(client_id, redirect_uri, display);

    return window.plugins.fbConnect;
}

/**
* Session management functionality
*/
FBConnect.prototype.resetSession = function () {
    this.status = "unknown";
    this.session = {};
    this.session.access_token = null;
    this.session.expires = 0;
    this.session.secret = null;
    this.session.session_key = null;
    this.session.sig = null;
    this.session.uid = null;
}

FBConnect.prototype.restoreLastSession = function () {
    var session = JSON.parse(localStorage.getItem('pg_fb_session'));
    if (session) {
        this.session = session;
    }
}

FBConnect.prototype.saveSession = function () {
    localStorage.setItem('pg_fb_session', JSON.stringify(this.session));
}