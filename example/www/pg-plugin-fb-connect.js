PG = ( typeof PG == 'undefined' ? {} : PG );
PG.FB = {
    init: function(apiKey) {
        PhoneGap.exec(null, null, 'com.phonegap.facebook.Connect', 'init', [apiKey]);
    },
    login: function(a, b) {
        b = b || { perms: '' };
        PhoneGap.exec(function(e) { // login
            FB.Auth.setSession(e.session, 'connected');
            if (a) a(e);
        }, null, 'com.phonegap.facebook.Connect', 'login', b.perms.split(',') );
    },
    logout: function(cb) {
        PhoneGap.exec(function(e) {
            FB.Auth.setSession(null, 'notConnected');
            if (cb) cb(e);
        }, null, 'com.phonegap.facebook.Connect', 'logout', []);
    },
    getLoginStatus: function(cb) {
        PhoneGap.exec(function(e) {
            if (cb) cb(e);
        }, null, 'com.phonegap.facebook.Connect', 'getLoginStatus', []);
    }
};