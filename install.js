var fs = require('fs'),
    util = require('util'),
    exec = require('child_process').exec,
    puts = function(error, stdout, stderr) { util.puts(stdout); },
    shell = function(command) { exec(command, puts); };

var appDir = process.argv[2],
    platform = process.argv[3].toLowerCase();

// Normalize slash
if (appDir[appDir.length-1] != '/') {
  appDir = appDir + '/';
}

if (platform == 'android') {
  // Add connect plugin to plugins.xml
  var pluginsFile = appDir + 'res/xml/plugins.xml';
  var pluginsXml = fs.readFileSync(pluginsFile).toString();
  pluginsXml = pluginsXml.replace(/<\/plugins>/gi,'<plugin name="com.phonegap.facebook.Connect" value="com.phonegap.facebook.ConnectPlugin" /></plugins>'); 
  fs.writeFileSync(pluginsFile, pluginsXml);

  // Add placeholder element for facebook app secret
  var manifestFile = appDir + 'AndroidManifest.xml';
  var manifestXml = fs.readFileSync(manifestFile).toString();
  manifestXml = manifestXml.replace(/<\/application>/gi, '<meta-data android:name="app_secret" android:value="your_app_secret" /></application>');
  fs.writeFileSync(manifestFile, manifestXml);

  // Generate and patch the facebook-js, then copy it into the
  // application dir.
  shell("cd lib/facebook-js-sdk && php all.js.php >> ../facebook_js_sdk.js && cd .. && patch < facebook-js-patch && cp lib/facebook_js_sdk.js " + appDir + "assets/www");

  // Create a facebook-android-sdk.jar file and copy it into the project
  // dir
  shell("cd lib/facebook-android-sdk/facebook && jar cf facebook-android-sdk.jar src && cp facebook-android-sdk.jar " + appDir + "libs");

  // Copy native ConnectPlugin source into app dir
  shell("cp -r native/android/ " + appDir);

  // Copy ConnectPlugin JS into app dir
  shell("cp www/pg-plugin-fb-connect.js " + appDir + "assets/www");

  // Remind user to edit AndroidManifest.xml with their App Secret.
  console.log('All done! Remember to update your AndroidManifest.xml with your APP_SECRET, as provided by Facebook. It\'s in a <meta-data> element that we just added to your manifest file! Go do it! Nao!');
} else if (platform == 'ios') {
  console.log('Sorry dawg, not yet yo! Follow the manual iOS installation instructions in the README.');
}
