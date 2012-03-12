//////////////////////////
//
// Config
// Set your app id here.
//
//////////////////////////

if (window.location.host == 'facebookmobileweb.com' || window.location.host == 'www.facebookmobileweb.com') {
  var gAppID = '147366981996453';
}
//Add your Application ID here
else {
  var gAppID = 'enter_your_appid_here';
}

if (gAppID == 'enter_your_appid_here') {
  alert('You need to enter your App ID in js/_config.js on line 13.');
}

//Initialize the Facebook SDK
FB.init({ 
  appId: gAppID, 
  status: true,
  cookie: true,
  xfbml: true,
  frictionlessRequests: true,
  useCachedDialogs: true,
  oauth: true
});