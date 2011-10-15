PG = ( typeof PG == 'undefined' ? {} : PG );
PG.FB = {
    init: function(apiKey) {
        // create the fb-root element if it doesn't exist
        if (!document.getElementById('fb-root')) {
            var elem = document.createElement('div');
            elem.id = 'fb-root';
            document.body.appendChild(elem);
        }
        PhoneGap.exec(null, null, 'com.phonegap.facebook.Connect', 'init', [apiKey]);
    },
    login: function(a, b) {
        var session=null, key='pg_fb_session', success=function(e) {
            FB.Auth.setSession(e.session, 'connected');
            if (a) a(e);
        };
        b = b || { perms: '' };
        if ((session = JSON.parse(localStorage.getItem(key) || '{"expires":0}')) && session.expires > new Date().valueOf()) {
            success({'session': session});
        } else {
            PhoneGap.exec(function(e) { // login
                localStorage.setItem(key, JSON.stringify(e.session));
                success(e);
            }, null, 'com.phonegap.facebook.Connect', 'login', b.perms.split(',') );
        }
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