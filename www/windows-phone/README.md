PREREQUISITES
================================

Plugin requires ChildBrowser plugin to work properly. You can find it at https://github.com/purplecabbage/phonegap-plugins/tree/master/WindowsPhone/ChildBrowser

Getting Started
===============

Please use guidance below to start working with the plugin; facebook.html located in this directory provides full usage example. 

1. Add js references, for example 

	<script type="text/javascript" charset="utf-8" src="phonegap-1.1.0.js"></script>   
	<script type="text/javascript" charset="utf-8" src="pg-plugin-fb-connect.js"></script>
	<script type="text/javascript" charset="utf-8" src="facebook_js_sdk.js"></script>
	<script type="text/javascript" charset="utf-8" src="ChildBrowser.js"></script>

2. Initialize plugin

	document.addEventListener('deviceready', function () {
	try {
	
	    FB.Cookie.setEnabled(true); // this seems to be duplicate to 'cookie: true' below, but it is IMPORTANT due to FB implementation logic. 
	
	    FB.init({ appId: "311961255484993", nativeInterface: PG.FB, cookie: true });

	} catch (e) {
	    //alert(e);
	    console.log("Init error: " + e);
	}
	}, false);

3. Call facebook api

	FB.api('/me/friends', function (response) {
	    if (response.error) {
	        console.log(JSON.stringify(response.error));
	    } else {
	        var data = document.getElementById('data');
	        response.data.forEach(function (item) {
	            var d = document.createElement('div');
	            d.innerHTML = item.name;
	            data.appendChild(d);
	        });
	    }
	});