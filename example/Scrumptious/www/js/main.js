var DEBUG_MODE = false;

var selectedMealIndex = -1;
var selectedPlaceIndex = -1;
var selectedPlaceID = null;
var nearbyPlaces = null;
var myFriends = null;
var currentlySelectedPlaceElement = null;
var selectedFriends = {};

// DATA

var meals = [
	{
		"id" : "cheeseburger",
		"title" : "Cheeseburger",
		"url" : "http://whispering-ravine-4547.herokuapp.com/cheeseburger.html"
	},
	{
		"id" : "chinese",
		"title" : "Chinese",
		"url" : "http://whispering-ravine-4547.herokuapp.com/chinese.html"
	},
	{
		"id" : "french",
		"title" : "French",
		"url" : "http://whispering-ravine-4547.herokuapp.com/french.html"
	},
	{
		"id" : "hotdog",
		"title" : "Hot Dog",
		"url" : "http://whispering-ravine-4547.herokuapp.com/hotdog.html"
	},
	{
		"id" : "indian",
		"title" : "Indian",
		"url" : "http://whispering-ravine-4547.herokuapp.com/indian.html"
	},
	{
		"id" : "italian",
		"title" : "Italian",
		"url" : "http://whispering-ravine-4547.herokuapp.com/italian.html"
	},
	{
		"id" : "pizza",
		"title" : "Pizza",
		"url" : "http://whispering-ravine-4547.herokuapp.com/pizza.html"
	},
];

// DOCUMENT-READY FUNCTIONS
$(function () {

          // Click handlers

          // Logout click handler
          $("#logout").click(function() {
            FB.logout(
              function (response) {
                window.location.reload();
              }
              );
            return false;
          });

          // Announce click handler
          $("#announce").click(function() {
            publishOGAction(null);
          });

          // Meal selection click handler
          $('#meal-list').on('click', 'li', function() {
            selectedMealIndex = $(this).index();
            console.log("Link in meal listview clicked... " + selectedMealIndex);
            displaySelectedMeal();
          });

          $('#detail-meal-select').click(function() {
            //console.log("Meal selected");
            $('#announce').removeClass('ui-disabled');
            $('#select-meal').html(meals[selectedMealIndex].title);
          });

          // Place selection click handler
          $('#places-list').on('click', 'li', function() {
            var selectionId = $(this).attr('data-name');
            console.log("Selected place " + selectionId);

            var selectionStatus = $(this).attr('data-icon');
            if (selectionStatus == "false") {
              // De-select any previously selected place
              if (currentlySelectedPlaceElement) {
                currentlySelectedPlaceElement.buttonMarkup({ icon: false });
              }
              // Place has been selected.
              $(this).buttonMarkup({ icon: "check" });            
              // Set the selected place info
              selectedPlaceID = selectionId;
              selectedPlaceIndex = $(this).index();
              $('#select-location').html(nearbyPlaces[selectedPlaceIndex].name);
              // Set the currently selected place element
              currentlySelectedPlaceElement = $(this);
            } else {
              // Previously selected place has been deselected
              $(this).buttonMarkup({ icon: false });
              // Reset the selected place info
              selectedPlaceID = null;
              selectedPlaceIndex = -1;
              $('#select-location').html("Select one");
            } 
          });

          // Friend selection click handler
          $('#friends-list').on('click', 'li', function() {
            var selectionId = $(this).attr('data-name');
            console.log("Selected friend " + selectionId);
            var selectedIndex = $(this).index();
            var selectionStatus = $(this).attr('data-icon');
            if (selectionStatus == "false") {
              // Friend has been selected.
              $(this).buttonMarkup({ icon: "check" });
              // Add to friend ID to selectedFriends associative array
              selectedFriends[selectionId] = myFriends[selectedIndex].name;
            } else {
              // Previously selected friend has been deselected
              $(this).buttonMarkup({ icon: false });
              // Remove the friend id
              delete selectedFriends[selectionId];
            } 
            var friendNameArray = [];
            for (var friendId in selectedFriends) {
              if (selectedFriends.hasOwnProperty(friendId)) {
                friendNameArray.push(selectedFriends[friendId]);
              }
            }

            if (friendNameArray.length > 2) {
              var otherFriends = friendNameArray.length - 1;
              $('#select-friends').html(friendNameArray[0] + " and " + otherFriends + " others");
            } else if (friendNameArray.length == 2) {
              $('#select-friends').html(friendNameArray[0] + " and " + friendNameArray[1]);
            } else if (friendNameArray.length == 1) {
              $('#select-friends').html(friendNameArray[0]);
            } else {
              $('#select-friends').html("Select friends");
            }
            
            console.log("Current select friends list: " + selectedFriends);
          });

  });
    
$( document ).delegate("#meals", "pageinit", function() {
  displayMealList();
});

$('body').bind('hideOpenMenus', function(){
    $("ul:jqmData(role='menu')").find('li > ul').hide();
}); 
var menuHandler = function(e) {
    $('body').trigger('hideOpenMenus');
    $(this).find('li > ul').show();
    e.stopPropagation();
};
$("ul:jqmData(role='menu') li > ul li").click(function(e) {
   $('body').trigger('hideOpenMenus');
e.stopPropagation();
});
$('body').delegate("ul:jqmData(role='menu')",'click',menuHandler);
$('body').click(function(e){
   $('body').trigger('hideOpenMenus');
});

// AUTHENTICATION

// Handle status changes
function handleStatusChange(response) {
  if (response.authResponse) {
    console.log(response);
    window.location.hash = '#menu';
    updateUserInfo(response);
  } else {
    console.log(response);
    window.location.hash = '#login';
  }
}

function promptLogin() {
  FB.login(null, {scope: 'email'});
}

function updateUserInfo(response) {
  FB.api('/me', 
    {fields:"name,first_name,picture"},
    function(response) {
      console.log(response);
      var output = '';
      output += '<img src="' + response.picture.data.url + '" width="25" height="25"></img>';
      output += ' ' + response.first_name;
      $('#user-identity').html(output);
  });
}


// GRAPH API (OPEN GRAPH)
function handleOGSuccess() {
	console.log("[handleOGSuccess] done.");
  showPublishConfirmation();

  // Clear out selections
  selectedMealIndex = -1;
  selectedPlaceIndex = -1;
  selectedPlaceID = null;
  currentlySelectedPlaceElement = null;
  selectedFriends = {};
  // Reset the placeholders
  $('#select-meal').html("Select one");
  $('#select-location').html("Select one");
  $('#select-friends').html("Select friends");
  // Disable the announce button
  $('#announce').addClass('ui-disabled');

}

function handleGenericError(e) {
	console.log("Error ..."+JSON.stringify(e));
}

function handlePublishOGError(e) {
	console.log("Error publishing ..."+JSON.stringify(e));
	var errorCode = e.code;
	console.log("Error code ..."+errorCode);
	if (errorCode == "200") {
		// Request publish actions, probably missing piece here
		reauthorizeForPublishPermissions();
	}
}

function reauthorizeForPublishPermissions() {
	console.log("[reauthorizeForPublishPermissions] asking for additional permissions.");
	// If successful, try publishing action again
	// else, just show error
	FB.login(
		function (response) {
			if (!response || response.error) {
				handleGenericError(response.error);
			} else {
				publishOGAction(response);
			}
		}, {scope:'publish_actions'}
	);
}

function publishOGAction(response) {
	var errorHandler = null;
	// Handle if we came in via a reauth.
	// Also avoid loops, set generic error
	// handler if already reauthed.
	if (!response || response.error) {
		errorHandler = handlePublishOGError;
	} else {
		errorHandler = handleGenericError;
	}
	console.log("Publishing action...");
	var params = {
		"meal" : meals[selectedMealIndex].url
	};
	if (selectedPlaceID) {
		params.place = selectedPlaceID;
	}
	var friendIDArrays = [];
	for (var friendId in selectedFriends) {
		if (selectedFriends.hasOwnProperty(friendId)) {
			friendIDArrays.push(friendId);
		}
	}
	if (friendIDArrays.length > 0) {
		params.tags = friendIDArrays.join();
	}
	console.log("Publish params " + JSON.stringify(params));
	FB.api("/me/cordova:eat",
    	"POST",
    	params,
    	function (response) {
    		console.log(response);
    		if (!response || response.error) {
    			errorHandler(response.error);
    		} else {
    			handleOGSuccess(response);
    		}
    	}
	);
}

function showPublishConfirmation() {
  $("#confirmation").append("<p>Publish successful</p>");
  // Fade out the message
  $("#confirmation").fadeOut(3000, function() {
    $("#confirmation").html("");
    $("#confirmation").show();
  });
}

// DATA FETCH AND DISPLAY

// Meals
function displayMealList() {
  // Meal list
  console.log("[displayMealList] displaying meal list.");
	var tmpl = $("#meal_list_tmpl").html();
	var output = Mustache.to_html(tmpl, meals);
	$("#meal-list").html(output).listview('refresh');
}

function displaySelectedMeal() {
  console.log("[displaySelectedMeal] displaying selected meal.");
  var meal = meals[selectedMealIndex];
  // Set up meal display
	var tmpl = $("#selected_meal_tmpl").html();
	var output = Mustache.to_html(tmpl, meal);
	$("#selected_meal").html(output);
}

// Nearby Places
function getNearby() {
  // Check for and use cached data
  if (nearbyPlaces)
    return;

  console.log("[getNearby] get nearby data.");

  // First use browser's geolocation API to obtain location
  navigator.geolocation.getCurrentPosition(function(location) {
    //curLocation = location;
    console.log(location);

    // Use graph API to search nearby places
    var path = '/search?type=place&q=restaurant&center=' + location.coords.latitude + ',' + location.coords.longitude + '&distance=1000&fields=id,name,picture';
    
    FB.api(path, function(response) {
    	if (!response || response.error) {
    		console.log("Error fetching nearby place data.");
    	} else {
    		nearbyPlaces = response.data;
    		console.log(nearbyPlaces);
    		displayPlaces(nearbyPlaces);
    	}
    });
  });
}

function displayPlaces(places) {
  // Places list
  console.log("[displayPlaces] displaying nearby list.");
	var tmpl = $("#places_list_tmpl").html();
	var output = Mustache.to_html(tmpl, places);
	$("#places-list").html(output).listview('refresh');
}

// Friends
function getFriends() {
  // Check for and use cached data
  if (myFriends)
    return;

  console.log("[getFriends] get friend data.");
  // Use the Graph API to get friends
  FB.api('/me/friends', { fields: 'name, picture', limit: '50' }, function(response) {
  	if (!response || response.error) {
  		console.log("Error fetching friend data.");
  	} else {
  		myFriends = response.data;
  		console.log(myFriends);
  		displayFriends(myFriends);
  	}
  });
}

function displayFriends(friends) {
  // Friends list
  console.log("[displayFriends] displaying friend list.");
	var tmpl = $("#friends_list_tmpl").html();
	var output = Mustache.to_html(tmpl, friends);
	$("#friends-list").html(output).listview('refresh');
}
