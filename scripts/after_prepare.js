#!/usr/bin/env node
'use strict';

var fs = require('fs');

var getPreferenceValue = function(config, name) {
    var value = config.match(new RegExp('name="' + name + '" value="(.*?)"', "i"))
    if(value && value[1]) {
        return value[1]
    } else {
        return null
    }
}

if(process.argv.join("|").indexOf("APP_ID=") > -1) {
	var APP_ID = process.argv.join("|").match(/APP_ID=(.*?)(\||$)/)[1]
} else {
	var config = fs.readFileSync("config.xml").toString()
	var APP_ID = getPreferenceValue(config, "APP_ID")
}

var files = [
    "platforms/browser/www/plugins/cordova-plugin-facebook4/www/facebook-browser.js",
    "platforms/browser/platform_www/plugins/cordova-plugin-facebook4/www/facebook-browser.js",
    "platforms/browser/www/cordova.js",
    "platforms/browser/platform_www/cordova.js"
]

for(var i in files) {
    try {
    	var contents = fs.readFileSync(files[i]).toString()
	    fs.writeFileSync(files[i], contents.replace(/APP_ID/g, APP_ID))
	} catch(err) {}
}
