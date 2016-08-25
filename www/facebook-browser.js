/* global FB */
var isInited = false

exports.getLoginStatus = function getLoginStatus (s, f) {
  if (!assertInited()) return printError(f, new Error('init not called with valid version'))
  FB.getLoginStatus(function (response) {
    s(response)
  })
}

exports.showDialog = function showDialog (options, s, f) {
  if (!assertInited()) return printError(f, new Error('init not called with valid version'))

  options.name = options.name || ''
  options.message = options.message || ''
  options.caption = options.caption || ''
  options.description = options.description || ''
  options.href = options.href || ''
  options.picture = options.picture || ''
  options.quote = options.quote || ''

  FB.ui(options, function (response) {
    if (response && (response.request || !response.error_code)) {
      s(response)
      return
    }
    printError(f, response)
  })
}
// Attach this to a UI element, this requires user interaction.
exports.login = function login (permissions, s, f) {
  if (!assertInited()) return printError(f, new Error('init not called with valid version'))
  // JS SDK takes an object here but the native SDKs use array.
  var options = {}
  if (permissions && permissions.length > 0) {
    var index = permissions.indexOf('rerequest')
    if (index > -1) {
      permissions.splice(index, 1)
      options.auth_type = 'rerequest'
    }
    options.scope = permissions.join(',')
  }

  FB.login(function (response) {
    if (response.authResponse) {
      s(response)
    } else {
      printError(f, response.status)
    }
  }, options)
}

exports.getAccessToken = function getAccessToken (s, f) {
  var response = FB.getAccessToken()
  if (response) {
    s(response)
    return
  }
  printError(f, new Error('NO_TOKEN'))
}

exports.logEvent = function logEvent (eventName, params, valueToSum, s, f) {
  // AppEvents are not avaliable in JS.
  s()
}

exports.logPurchase = function (value, currency, s, f) {
  // AppEvents are not avaliable in JS.
  s()
}

exports.appInvite = function (options, s, f) {
  // App Invites are not avaliable in JS.
  s()
}

exports.logout = function (s, f) {
  if (!assertInited()) return printError(f, new Error('init not called with valid version'))
  FB.logout(function (response) {
    s(response)
  })
}

exports.api = function (graphPath, permissions, s, f) {
  if (!assertInited()) return printError(f, new Error('init not called with valid version'))
  // JS API does not take additional permissions
  FB.api(graphPath, function (response) {
    if (response.error) {
      f(response)
    } else {
      s(response)
    }
  })
}

exports.browserInit = function (appId, version, s) {
  console.warn("browserInit is deprecated and may be removed in the future");
}

function assertInited () {
  if (!isInited) {
    return false
  }
  return true
}

function printError (f, err) {
  if (typeof f === 'function') {
    f(err.message)
    return
  }
  console.error(err.stack)
}

(function(w) {
  if (w.location.protocol != "file:") {
    console.warn("Facebook JS SDK is not supported when using file:// protocol");
    return;
  }

  w.fbAsyncInit = function() {
    FB.init({
      appId      : APP_ID,  // APP_ID is populated by the cordova after_prepare hook
      xfbml      : true,
      version    : 'v2.6'
    });

    isInited = true
  };

  (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement(s); js.id = id;
      js.src = "//connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
}(window));
