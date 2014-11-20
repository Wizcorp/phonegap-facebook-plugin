var exec = require('cordova/exec');

function doApiCall(method, graphPath, permissions, s, f) {
    this.getAccessToken(function(token) {
        var uri = 'https://graph.facebook.com/v2.0/' + graphPath;
        if (graphPath.indexOf('?') == -1)
            uri += '?';
        else
            uri += '&';
        uri += 'access_token=' + token;

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState === 4){
                if (xmlhttp.status == 200) {
                    s(JSON.parse(xmlhttp.responseText));
                } else {
                    if (f)
                        f();
                }
            }
        };
        xmlhttp.open(method, uri, true);
        xmlhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        xmlhttp.send(null);
    }, f);
}

module.exports = {
     showDialog: function (options, s, f) {
        navigator.notification.prompt('Post to Wall', function(obj) {
            if (obj.buttonIndex == 1) {
                doApiCall.bind(this)('POST', 'me/feed?message=' + escape(obj.input1));
            } else if (f) {
                f('User cancelled dialog');
            }
        }.bind(this), 'Facebook', ['Share', 'Cancel']);
    },

    api: function (graphPath, permissions, s, f) {
        doApiCall.bind(this)('GET', graphPath, permissions, s, f);
    }
};
