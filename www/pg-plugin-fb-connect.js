PG = ( typeof PG == 'undefined' ? {} : PG );
PG.FB = {
  init: function(apiKey, fail) {
    // create the fb-root element if it doesn't exist
    if (!document.getElementById('fb-root')) {
      var elem = document.createElement('div');
      elem.id = 'fb-root';
      document.body.appendChild(elem);
    }
    // Check local storage session for initialization
    var storedSession = {};
    if (localStorage.getItem('pg_fb_session')) {
      var checkSession = JSON.parse(localStorage.getItem('pg_fb_session'));
      if (checkSession && checkSession.accessToken && checkSession.expirationTime) {
        var nowTime = (new Date()).getTime();
        if (checkSession.expirationTime > nowTime) {
          var updatedExpiresIn = Math.floor((checkSession.expirationTime - nowTime) / 1000);
          checkSession.expiresIn = updatedExpiresIn;
          // Update expires in info in local storage
          localStorage.setItem('pg_fb_session', JSON.stringify(checkSession));
          storedSession = {"accessToken":checkSession.accessToken,
                           "expiresIn":checkSession.expiresIn};
        }
      }
    }
    PhoneGap.exec(function() {
      var authResponse = JSON.parse(localStorage.getItem('pg_fb_session') || '{"expiresIn":0}');
      var nowTime = (new Date()).getTime();
      if (authResponse && authResponse.accessToken
          && authResponse.expirationTime && (authResponse.expirationTime > nowTime)) {
        // Set auth response to simulate a successful login
        FB.Auth.setAuthResponse(authResponse, 'connected');
      }
      console.log('PhoneGap Facebook Connect plugin initialized successfully.');
    }, (fail?fail:null), 'com.phonegap.facebook.Connect', 'init', [apiKey, storedSession]);
  },
  login: function(params, cb, fail) {
    params = params || { scope: '' };
    PhoneGap.exec(function(e) { // login
        if (e.authResponse && e.authResponse.expiresIn) {
          var expirationTime = e.authResponse.expiresIn === 0
          ? 0 
          : (new Date()).getTime() + e.authResponse.expiresIn * 1000;
          e.authResponse.expirationTime = expirationTime; 
        }
        localStorage.setItem('pg_fb_session', JSON.stringify(e.authResponse));
        FB.Auth.setAuthResponse(e.authResponse, 'connected');
        if (cb) cb(e);
    }, (fail?fail:null), 'com.phonegap.facebook.Connect', 'login', params.scope.split(',') );
  },
  logout: function(cb, fail) {
    PhoneGap.exec(function(e) {
      localStorage.removeItem('pg_fb_session');
      FB.Auth.setAuthResponse(null, 'notConnected');
      if (cb) cb(e);
    }, (fail?fail:null), 'com.phonegap.facebook.Connect', 'logout', []);
  },
  getLoginStatus: function(cb, fail) {
    PhoneGap.exec(function(e) {
      if (cb) cb(e);
    }, (fail?fail:null), 'com.phonegap.facebook.Connect', 'getLoginStatus', []);
  },
  dialog: function(params, cb, fail) {
    PhoneGap.exec(function(e) { // login
      if (cb) cb(e);
                  }, (fail?fail:null), 'com.phonegap.facebook.Connect', 'showDialog', [params] );
  }
};
