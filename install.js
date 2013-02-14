var fs = require('fs'),
    util = require('util'),
    exec = require('child_process').exec,
    shell = function(command, cb) { exec(command, function(error, stdout, stderr) {
      if (error !== null) {
        console.log('ERROR!' + error);
        util.puts(stderr);
      } else {
        util.puts(stdout);
      }
      if (cb) cb();
    }); };

var appDir = process.argv[2],
    platform = process.argv[3].toLowerCase();

// Normalize slash
if (appDir[appDir.length-1] != '/') {
  appDir = appDir + '/';
}

if (platform == 'android') {
  // Figure out the package for the generated app.
  exec('find ' + appDir + 'src -name "*.java"', function(e, o, err) {
    var javaFile = o.replace(/\n/g, '');
    var contents = fs.readFileSync(javaFile).toString();
    var pkg = contents.match(/package\s(.*);/)[1];
    // Copy facebook-android-sdk res into app dir
    // TODO: compile/jar this up instead of doing this hacky BS
    shell("cp -rf lib/facebook-android-sdk/facebook/src " + appDir, function() {
      var dialogFile = appDir + 'src/com/facebook/android/FbDialog.java';
      var dialogContents = fs.readFileSync(dialogFile).toString();
      dialogContents = dialogContents.replace(/public class/gi, 'import ' + pkg + '.*;\npublic class'); // HACK: to get around android.R package resolution issues
      fs.writeFileSync(dialogFile, dialogContents);
    });
  });

  // Add connect plugin to plugins.xml
  var pluginsFile = appDir + 'res/xml/plugins.xml';
  var pluginsXml = fs.readFileSync(pluginsFile).toString();
  pluginsXml = pluginsXml.replace(/<\/plugins>/gi,'<plugin name="com.phonegap.facebook.Connect" value="com.phonegap.facebook.ConnectPlugin" /></plugins>'); 
  fs.writeFileSync(pluginsFile, pluginsXml);

  // Generate and patch the facebook-js, then copy it into the
  // application dir.
  //shell("rm lib/facebook_js_sdk.js*", function() {
  //  shell("cd lib/facebook-js-sdk && php all.js.php >> ../facebook_js_sdk.js && cd .. && patch < facebook-js-patch && cp facebook_js_sdk.js " + appDir + "assets/www");
  //});

  // Copy facebook-android-sdk res into app dir
  shell("cp -rf lib/facebook-android-sdk/facebook/res " + appDir);

  // Copy native ConnectPlugin source into app dir
  shell("cp -r native/android/ " + appDir);

  // Copy ConnectPlugin JS into app dir
  shell("cp www/pg-plugin-fb-connect.js " + appDir + "assets/www");

  // Copy example index in.
  shell("cp example/www/index.html " + appDir + "assets/www");

  // Remind user to edit AndroidManifest.xml with their App Secret.
  console.log('In your app please make sure to properly include your Facebook application ID when you call "FB.init"!');
} else if (platform == 'ios') {
  console.log('Sorry dawg, not yet yo! Follow the manual iOS installation instructions in the README.');
}
