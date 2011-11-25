PG = ( typeof PG == 'undefined' ? {} : PG );

(function(){
    var key = 'PG.FB.response', // localStorage key
        service = 'com.phonegap.facebook.Connect'; // PhoneGap service to use

    PG.FB = {
        init: function(apiKey) {
            // create the fb-root element if it doesn't exist
            if (!document.getElementById('fb-root')) {
                var elem = document.createElement('div');
                elem.id = 'fb-root';
                document.body.appendChild(elem);
            }

            console.log('PG.FB.init() called');

            PhoneGap.exec(function() {
                console.log('PG.FB.init(): com.phonegap.facebook.Connect.init success');

                var session = JSON.parse(localStorage.getItem(key) || '{"expires":0}');
                if (session && session.expires > new Date().valueOf()) {
                    FB.Auth.setSession(session, 'connected');
                }
            }, null, service, 'init', [apiKey]);
        },

        login: function(cb, opts) {
            console.log('PG.FB.login() called');

            opts = opts || { scope: '' };

            PhoneGap.exec(function (response) {
                console.log('PG.FB.login.success: ' + JSON.stringify(response) + ', store into localStorage ...');

                localStorage.setItem(key, JSON.stringify(response));

                console.log('PG.FB.login.success: calling FB.Auth.setAuthResponse() ...');
                FB.Auth.setAuthResponse(response.authResponse, response.status);

                if (cb) {
                    cb(response);
                }
            }, null, service, 'login', opts.scope.split(','));
        },

        logout: function(cb) {
            console.log('PG.FB.logout() called');

            PhoneGap.exec(function(e) {
                FB.Auth.setSession(null, 'notConnected');
                if (cb) cb(e);
            }, null, service, 'logout', []);
        },

        getLoginStatus: function(cb) {
            console.log('PG.FB.getLoginStatus() called');

            PhoneGap.exec(function(e) {
                if (cb) cb(e);
            }, null, service, 'getLoginStatus', []);
        }
    };
})();
