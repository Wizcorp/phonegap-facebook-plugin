// replace this with your own APP_ID
var APP_ID = '126462174095513' // <----( this is the PhoneGap-Facebook app id
FB.initWithAppId(APP_ID)

test('login', function loginToFacebook () {
    QUnit.stop()
    FB.onLogin = function login (e) {
        QUnit.start()
        ok(true, 'user can login')
    }
    FB.authorize('email read_stream publish_stream offline_access'.split(' '))
})

test('failed login', function() {
    QUnit.stop()
    FB.onDidNotLogin = function loginFailed () {
        QUnit.start()
        ok(true, 'can capture failed login attempt')
    }
})	
	
test('get friends', function() {
    QUnit.stop()
    var req = facebook.getFriends()
    req.onload = function friends (e) {
        QUnit.start()
		var friends = JSON.parse(e.target.responseText).data
        ok(friends, 'returned friends array')
        console.log('found ' + friends.length + ' friends!')
		for(var i=0, l=friends.length; i < l; i++) {
			var id = friends[i].id
            ,   name = friends[i].name
            console.log(name)
		}
	}
})

test('logout',function() {
    QUnit.stop()
    FB.onLogout = function logout (e) {
        QUnit.start()
        ok(true, 'user can logout')
    }
    FB.logout();
}) 
