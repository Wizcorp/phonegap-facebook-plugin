CDV = ( typeof CDV == 'undefined' ? {} : CDV );
CDV.FB = {
  init: function(apiKey, fail) {
    // create the fb-root element if it doesn't exist
    if (!document.getElementById('fb-root')) {
      var elem = document.createElement('div');
      elem.id = 'fb-root';
      document.body.appendChild(elem);
    }
    // Check local storage session for initialization
    var storedSession = {};
    if (localStorage.getItem('cdv_fb_session')) {
      var checkSession = JSON.parse(localStorage.getItem('cdv_fb_session'));
      if (checkSession && checkSession.accessToken && checkSession.expirationTime) {
        var nowTime = (new Date()).getTime();
        if (checkSession.expirationTime > nowTime) {
          var updatedExpiresIn = Math.floor((checkSession.expirationTime - nowTime) / 1000);
          checkSession.expiresIn = updatedExpiresIn;
          // Update expires in info in local storage
          localStorage.setItem('cdv_fb_session', JSON.stringify(checkSession));
          storedSession = {"accessToken":checkSession.accessToken,
                           "expiresIn":checkSession.expiresIn};
        }
      }
    }
    Cordova.exec(function() {
      var authResponse = JSON.parse(localStorage.getItem('cdv_fb_session') || '{"expiresIn":0}');
      var nowTime = (new Date()).getTime();
      if (authResponse && authResponse.accessToken 
          && authResponse.expirationTime && (authResponse.expirationTime > nowTime)) { 
        // Set auth response to simulate a successful login
        FB.Auth.setAuthResponse(authResponse, 'connected');
      }
      console.log('Cordova Facebook Connect plugin initialized successfully.');
    }, (fail?fail:null), 'org.apache.cordova.facebook.Connect', 'init', [apiKey, storedSession]);
  },
  login: function(params, cb, fail) {
    params = params || { scope: '' };
    Cordova.exec(function(e) { // login
        if (e.authResponse && e.authResponse.expiresIn) {
          var expirationTime = e.authResponse.expiresIn === 0
          ? 0 
          : (new Date()).getTime() + e.authResponse.expiresIn * 1000;
          e.authResponse.expirationTime = expirationTime; 
        }
        localStorage.setItem('cdv_fb_session', JSON.stringify(e.authResponse));
        FB.Auth.setAuthResponse(e.authResponse, 'connected');
        if (cb) cb(e);
    }, (fail?fail:null), 'org.apache.cordova.facebook.Connect', 'login', params.scope.split(',') );
  },
  logout: function(cb, fail) {
    Cordova.exec(function(e) {
      localStorage.removeItem('cdv_fb_session');
      FB.Auth.setAuthResponse(null, 'notConnected');
      if (cb) cb(e);
    }, (fail?fail:null), 'org.apache.cordova.facebook.Connect', 'logout', []);
  },
  getLoginStatus: function(cb, fail) {
    Cordova.exec(function(e) {
      if (cb) cb(e);
    }, (fail?fail:null), 'org.apache.cordova.facebook.Connect', 'getLoginStatus', []);
  },
  dialog: function(params, cb, fail) {
    Cordova.exec(function(e) { // login
      if (cb) cb(e);
                  }, (fail?fail:null), 'org.apache.cordova.facebook.Connect', 'showDialog', [params] );
  }
};
