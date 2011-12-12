PG = ( typeof PG == 'undefined' ? {} : PG );
PG.FB = {
  init: function(apiKey, fail) {
    // create the fb-root element if it doesn't exist
    if (!document.getElementById('fb-root')) {
      var elem = document.createElement('div');
      elem.id = 'fb-root';
      document.body.appendChild(elem);
    }
    PhoneGap.exec(function() {
      var session = JSON.parse(localStorage.getItem('pg_fb_session') || '{"expires":0}');
      if (session && session.expires > new Date().valueOf()) {
        FB.Auth.setSession(session, 'connected');
      }
      console.log('PhoneGap Facebook Connect plugin initialized successfully.');
    }, (fail?fail:null), 'com.phonegap.facebook.Connect', 'init', [apiKey]);
  },
  login: function(params, cb, fail) {
    params = params || { perms: '' };
    PhoneGap.exec(function(e) { // login
        localStorage.setItem('pg_fb_session', JSON.stringify(e.session));
        FB.Auth.setSession(e.session, 'connected');
        if (cb) cb(e);
    }, (fail?fail:null), 'com.phonegap.facebook.Connect', 'login', params.perms.split(',') );
  },
  logout: function(cb, fail) {
    PhoneGap.exec(function(e) {
      localStorage.removeItem('pg_fb_session');
      FB.Auth.setSession(null, 'notConnected');
      if (cb) cb(e);
    }, (fail?fail:null), 'com.phonegap.facebook.Connect', 'logout', []);
  },
  getLoginStatus: function(cb, fail) {
    PhoneGap.exec(function(e) {
      if (cb) cb(e);
    }, (fail?fail:null), 'com.phonegap.facebook.Connect', 'getLoginStatus', []);
  }
};
