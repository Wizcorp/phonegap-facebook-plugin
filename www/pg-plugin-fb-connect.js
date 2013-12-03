
var exec = require('cordova/exec');

CDV = {
  init: function (apiKey, cb, fail) {
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

    exec(function (e) {
        var authResponse = JSON.parse(localStorage.getItem('cdv_fb_session') || '{"expiresIn":0}');
        if (authResponse && authResponse.expirationTime) {
          var nowTime = (new Date()).getTime();
          if (authResponse.expirationTime > nowTime) {
            // Update expires in information
            updatedExpiresIn = Math.floor((authResponse.expirationTime - nowTime) / 1000);
            authResponse.expiresIn = updatedExpiresIn;
          }
          localStorage.setItem('cdv_fb_session', JSON.stringify(authResponse));
        }
        if (authResponse) {
          if (cb) cb(authResponse);
        }
      }, (fail ? fail : null), 'FacebookConnect', 'init', [apiKey]
    );
  },

  login: function (params, cb, fail) {
    params = params || { scope: '' };
    exec(function (e) { // login
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
    exec(function (e) {
      localStorage.removeItem('cdv_fb_session');
      if (cb) cb(e);
    }, (fail ? fail : null), 'FacebookConnect', 'logout', []);
  },

  getLoginStatus: function (cb, fail) {
    exec(function (e) {
      if (cb) cb(e);
    }, (fail ? fail : null), 'FacebookConnect', 'getLoginStatus', []);
  },

  dialog: function (params, cb, fail) {
    exec(function (e) { // login
      if (cb) cb(e);
    }, (fail ? fail : null), 'FacebookConnect', 'showDialog', [params]);
  }
};

module.exports = CDV;
