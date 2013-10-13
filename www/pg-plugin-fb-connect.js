
var exec = require('cordova/exec');

CDV = {
  init: function (apiKey, fail) {
    console.log('CDV FB.init');
    // create the fb-root element if it doesn't exist
    if (!document.getElementById('fb-root')) {
      var elem = document.createElement('div');
      elem.id = 'fb-root';
      document.body.appendChild(elem);
    }
    /**
     * TODO: Workout why this impressions part is needed. I think we should be using the AppEvent functionality instead.
     */
    /*
     var xmlhttp = new XMLHttpRequest();
     xmlhttp.onload=function(){console.log("Endpoint saved "+ this.responseText);}
     xmlhttp.open("POST", "https://www.facebook.com/impression.php", true);
     xmlhttp.send('plugin=featured_resources&payload={"resource": "adobe_phonegap", "appid": "'+apiKey+'", "version": "3.0.0" }');
     */

    exec(function () {
        var authResponse = JSON.parse(localStorage.getItem('cdv_fb_session') || '{"expiresIn":0}');
        if (authResponse && authResponse.expirationTime) {
          var nowTime = (new Date()).getTime();
          if (authResponse.expirationTime > nowTime) {
            // Update expires in information
            updatedExpiresIn = Math.floor((authResponse.expirationTime - nowTime) / 1000);
            authResponse.expiresIn = updatedExpiresIn;

            localStorage.setItem('cdv_fb_session', JSON.stringify(authResponse));
            FB.Auth.setAuthResponse(authResponse, 'connected');
          }
        }
        console.log('Cordova Facebook Connect plugin initialized successfully.');
      }, (fail ? fail : null), 'FacebookConnect', 'init', [apiKey]
    );
  },

  login: function (params, cb, fail) {
    params = params || { scope: '' };
    console.log('CDV FB.login');
    exec(function (e) { // login
      console.log('Login event', e, FB);
      if (e.authResponse && e.authResponse.expiresIn) {
        var expirationTime = e.authResponse.expiresIn === 0
          ? 0
          : (new Date()).getTime() + e.authResponse.expiresIn * 1000;
        e.authResponse.expirationTime = expirationTime;
      }
      localStorage.setItem('cdv_fb_session', JSON.stringify(e.authResponse));
      if (cb) cb(e);
    }, (fail ? fail : null), 'FacebookConnect', 'login', params.scope.split(','));
  },

  logout: function (cb, fail) {
    console.log('CDV FB.logout');
    exec(function (e) {
      localStorage.removeItem('cdv_fb_session');
      //FB.Auth.setAuthResponse(null, 'notConnected');
      if (cb) cb(e);
    }, (fail ? fail : null), 'FacebookConnect', 'logout', []);
  },

  getLoginStatus: function (cb, fail) {
    console.log('CDV FB.getLoginStatus');
    exec(function (e) {
      if (cb) cb(e);
    }, (fail ? fail : null), 'FacebookConnect', 'getLoginStatus', []);
  },

  dialog: function (params, cb, fail) {
    console.log('CDV FB.dialog');
    exec(function (e) { // login
      if (cb) cb(e);
    }, (fail ? fail : null), 'FacebookConnect', 'showDialog', [params]);
  }
};

module.exports = CDV;
