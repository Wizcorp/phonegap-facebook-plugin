var _FB_init = FB.init;

FB.init = function(obj) {
	PhoneGap.exec(
		function(e) {
			obj.session = e.session;
			_FB_init.call(FB, obj);
		}, 
		function(e) {console.log('init fail'); console.log(e);}, 
		'com.facebook.phonegap.Connect', 'init', [obj.appId]);
};

FB.login = function(win, fail, permissions) {
	PhoneGap.exec(function(e) {
		FB.Auth.setSession(e.session, 'connected');
		win.call(window, e);
	}, fail, 'com.facebook.phonegap.Connect', 'login', permissions);
};

FB.logout = function(win, fail) {
	PhoneGap.exec(function(e) {
		FB.Auth.setSession(null, 'notConnected');
		win.call(window, e);
	}, fail, 'com.facebook.phonegap.Connect', 'logout', []);
};

FB.getLoginStatus = function(win, b) {
	if (!FB._apiKey) {
		FB.log('FB.getLoginStatus() called before calling FB.init().');
		return;
	}
	if (win) if (!b && FB.Auth._loadState == 'loaded') {
		win({
			status: FB._userStatus,
			session: FB._session
		});
		return;
	} else FB.Event.subscribe('FB.loginStatus', win);
	if (!b && FB.Auth._loadState == 'loading') return;
	FB.Auth._loadState = 'loading';
	PhoneGap.exec(function(e) {
		FB.Auth._loadState = 'loaded';
		FB.Event.fire('FB.loginStatus', e);
		FB.Event.clear('FB.loginStatus');
		if (typeof win === 'function') win.call(window);
	}, null, 'com.facebook.phonegap.Connect', 'getLoginStatus', []);
};