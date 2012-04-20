//////////////////////////
//
// Authentication
// See "Logging the user in" on https://developers.facebook.com/mobile
//
//////////////////////////

var user = [];

//Detect when Facebook tells us that the user's session has been returned
FB.Event.monitor('auth.statusChange', function(session) {
  console.log('Got the user\'s session: ', session);
  
  if (session && session.status != 'not_authorized' && session.status != 'notConnected') {
    if (session.authResponse['accessToken']) {
      document.body.className = 'connected';
      
      //Fetch user's id, name, and picture
      FB.api('/me', {
        fields: 'name, picture'
      },
      function(response) {
        if (!response.error) {
          user = response;
          
          console.log('Got the user\'s name and picture: ', response);
          
          //Update display of user name and picture
          if (FB.$('user-name')) {
            FB.$('user-name').innerHTML = user.name;
          }
          if (FB.$('user-picture')) {
            FB.$('user-picture').src = user.picture;
          }
        }
        
        clearAction();
      });
    }
  }
  else if (session === undefined) {
    document.body.className = 'not_connected';
  
    clearAction();
  }
  else if (session && (session.status == 'not_authorized' || session.status == 'notConnected')) {
    document.body.className = 'not_connected';
    
    clearAction();
  }
});

//Prompt the user to login and ask for the 'email' permission
function promptLogin() {
  FB.login(null, {scope: 'email'});
}

//This will prompt the user to grant you acess to their Facebook Likes
function promptExtendedPermissions() {
  FB.login(function() {
    setAction("The 'user_likes' permission has been granted.", false);
    
    setTimeout('clearAction();', 2000);
    
    document.body.className = 'permissioned';
  }, {scope: 'user_likes'});
}

//See https://developers.facebook.com/docs/reference/rest/auth.revokeAuthorization/
function uninstallApp() {
  FB.api({method: 'auth.revokeAuthorization'},
    function(response) {
      window.location.reload();
    });
}

//See https://developers.facebook.com/docs/reference/javascript/FB.logout/
function logout() {
  FB.logout(function(response) {
    window.location.reload();
  });
}