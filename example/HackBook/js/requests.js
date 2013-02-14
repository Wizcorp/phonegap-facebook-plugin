//////////////////////////
//
// Requests
// See the "Requests" section on https://developers.facebook.com/mobile
//
//////////////////////////

//Send a request to friends have have logged into the app in the past, as well as friends that haven't
function sendRequestBoth() {
  FB.ui({
    method: 'apprequests',
    message: 'Learn how to make your mobile web app social',
  }, 
  function(response) {
    console.log('sendRequestBoth response: ', response);
  });
}

//Send an invite to friends that haven't logged into the app yet
function sendRequestInvite() {
  FB.ui({
    method: 'apprequests',
    suggestions: nonAppFriendIDs,
    message: 'Learn how to make your mobile web app social',
  }, function(response) {
    console.log('sendRequestInvite UI response: ', response);
  });
}

//Send a request to friends that are already using the app
function sendRequest() {
  FB.ui({
    method: 'apprequests',
    suggestions: appFriendIDs,
    message: 'Learn how to make your mobile web app social',
  }, function(response) {
    console.log('sendRequest UI response: ', response);
  });
}

//Send a request to a single friend that is using the app
function sendRequestSingle() {
  randNum = Math.floor ( Math.random() * friendIDs.length ); 

  var friendID = friendIDs[randNum];

  FB.ui({
    method: 'apprequests',
    //Use the first friend returned
    to: friendID,
    message: 'Learn how to make your mobile web app social',
  }, function(response) {
    console.log('sendRequestSingle UI response: ', response);
  });
}