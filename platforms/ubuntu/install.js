var fs = require('fs');
var path = require('path');

var platformDir = path.join(__dirname, '../../../..', 'platforms', 'ubuntu');

var qmlDir = path.join(platformDir, 'qml');
if (!fs.existsSync(qmlDir))
    fs.mkdirSync(qmlDir);

var manifest = JSON.parse(fs.readFileSync(path.join(platformDir, 'manifest.json'), {encoding: "utf8"}))
manifest.hooks.cordova["account-application"] = "qml/app.application";
manifest.hooks.cordova["account-service"] = "qml/app.service";
fs.writeFileSync(path.join(platformDir, 'manifest.json'), JSON.stringify(manifest));

var application = '<?xml version="1.0" encoding="UTF-8" ?><application id="' + manifest.name + '_' + manifest.version + '"><services><service id="' + manifest.name + '_cordova"><description>Post your pictures to Facebook</description></service></services></application>';
fs.writeFileSync(path.join(platformDir, 'qml', 'app.application'), application);

var service = '<?xml version="1.0" encoding="UTF-8"?><service id="' + manifest.name + '_cordova"><type>share</type><name>Cordova</name><provider>facebook</provider></service>';
fs.writeFileSync(path.join(platformDir, 'qml', 'app.service'), service)



