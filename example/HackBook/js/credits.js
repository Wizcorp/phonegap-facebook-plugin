//////////////////////////
//
// Credits
// See https://developers.facebook.com/docs/creditsapi/
//
//////////////////////////

//Prompt the user to pay for a virtual good
function sendPay() {
  FB.ui({
      method: 'pay',
      credits_purchase: false,
      // This is the item ID defined in your game or app
      order_info: 'locket'
  },
  function(response) {
    console.log('sendPay response: ', response);
  });
}

//If Hackbook is running from within the Facebook iOS native app, disable Credits
function checkForCredits() {
  if (FB.UA.nativeApp()) {
    document.getElementById('credits-button').style.display = 'none';
  }
}