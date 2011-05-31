// FIXME we shouldn't clobber any existing FB global...
var FB = {
	appId:null,
	accessToken:null,
	expiresIn:null,
	onFBLogin:null,
	onDidNotLogin:null,
	onFBLogout:null,	
	
	initWithAppId:function(appId) {
		this.appId = appId;
		PhoneGap.exec("FacebookConnectPlugin.initWithAppId",appId);
	},
	
	// array of permission strings: ex. 'email','feed',...
	// for details see: http://developers.facebook.com/docs/authentication/permissions/ 
	authorize:function() {
		var args = Array.prototype.slice.apply(arguments,[0]);
		args.unshift("FacebookConnectPlugin.authorize");
		PhoneGap.exec.apply(null,args);
	},
	
	showFeedPublishDialog:function(){
		PhoneGap.exec("FacebookConnectPlugin.showFeedPublishDialog");
	},
	
	logout:function(){
		PhoneGap.exec("FacebookConnectPlugin.logout");
	},
	
	// TODO: implement limit | offset | until | since
	getGraphRequest:function(path,postData) {
		var postDataStr;
		if(postData){
			var arr = [];
			for(var s in postData){
				postData.push(s + "=" + encodeURIComponent(postData[s]));
			}
			postDataStr = arr.join("&");
		}

		var url = "https://graph.facebook.com/" + path + "?access_token=" + this.accessToken;
		var req = new XMLHttpRequest();
		req.open((postDataStr ? "post" : "get"),url,true);
		req.send(postDataStr);
		return req;
	},
	
	getMyInfo:function(){
		return this.getGraphRequest("me");
	},
	
	getMyNewsFeed:function(){
		return this.getGraphRequest("me/home");
	},
	
	getUserInfo:function(userId){
		return this.getGraphRequest(userId);
	},
	
	getFriends:function(){
		console.log("appid = " + this.appId);
		return this.getGraphRequest("me/friends");
	},
	
	handleOpenUrl:function(url){
		var paramsToObject = function(params){
			var parts = params.split("&");
			var result = {};
			for(var n=0; n < parts.length; n++){
				var arg = parts[n].split("=");
				result[arg[0]] = arg[1].split("+").join(" ");
			}
			return result;
		}

		var decodedURL = decodeURI(url);

		var params = decodedURL.split("#")[1];
		if(params){		
			var result = paramsToObject(params);
			this.accessToken = result.access_token;
			this.expiresIn = result.expires_in;
			PhoneGap.exec("FacebookConnectPlugin.handleOpenUrl",url);
		} else {	
			PhoneGap.exec("FacebookConnectPlugin.handleOpenUrl",url);
			params = decodedURL.split("?")[1];
			this.lastError = paramsToObject(params);
			this.onDidNotLogin(this.lastError);
		}
	}
};
