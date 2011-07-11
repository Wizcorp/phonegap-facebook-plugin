PG = ( typeof PG == 'undefined' ? {} : PG );
PG.FB = {
    init: function(apiKey) {
        PhoneGap.exec(function(e) {
                        console.log("init: " + e);
                      }, null, 'com.facebook.phonegap.Connect', 'init', [apiKey]);
    },
    login: function(a, b) {
		try {
			b = b || { perms: '' };
			PhoneGap.exec(function(e) { // login
				//FB.Auth.setSession(e.session, 'connected'); // never gets called because the plugin spawns Mobile Safari/Facebook app
				if (a) a(e);
			}, null, 'com.facebook.phonegap.Connect', 'login', b.perms.split(',') );
		} catch (e) {
			alert(e);
		}
    },
    logout: function(cb) {
		try {
			PhoneGap.exec(function(e) {
				FB.Auth.setSession(null, 'notConnected');
				if (cb) cb(e);
			}, null, 'com.facebook.phonegap.Connect', 'logout', []);
		} catch (e) {
			alert(e);
		}
    },
    getLoginStatus: function(cb) {
		try {
			PhoneGap.exec(function(e) {
				if (cb) cb(e);
                console.log("getLoginStatus: " + e);
			}, null, 'com.facebook.phonegap.Connect', 'getLoginStatus', []);
		} catch (e) {
			alert(e);
		}
    },
    isAppInstalled: function(cb) {
        
    }
};
