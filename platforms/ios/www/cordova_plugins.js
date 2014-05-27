cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/com.phonegap.plugins.facebookconnect/www/phonegap/plugin/facebookConnectPlugin/facebookConnectPlugin.js",
        "id": "com.phonegap.plugins.facebookconnect.FacebookConnectPlugin",
        "clobbers": [
            "window.facebookConnectPlugin"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "com.phonegap.plugins.facebookconnect": "0.5.1"
}
// BOTTOM OF METADATA
});