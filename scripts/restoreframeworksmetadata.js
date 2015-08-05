#!/usr/bin/env node
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved.
// Licensed under the Apache License, Version 2.0.
// See License.txt in the project root for license information.

/* jshint node: true */

var path = require('path');
var fs = require('fs');

var PLATFORM = 'ios';

module.exports = function (ctx) {
    // We want to restore symlinks on ios build only
    if (ctx.opts.platforms.indexOf(PLATFORM) < 0 || process.platform !== 'darwin') return;

    var symlinkMetadata = path.join(__dirname, '..', 'symlinkmetadata.json');
    // If there is no metadata for symlinks, just skip this step
    if (!fs.existsSync(symlinkMetadata)) return;

    console.log('Restoring symlinks for custom frameworks');
    var frameworks = require(symlinkMetadata);
    var iosProjectWrapper = ctx.requireCordovaModule('../plugman/platforms/ios');

    var platformPluginsDir = iosProjectWrapper.parseProjectFile(path.join(ctx.opts.projectRoot, 'platforms', PLATFORM)).plugins_dir;
    var installedPluginDir = path.join(platformPluginsDir, ctx.opts.plugin.id);

    Object.keys(frameworks).forEach(function (framework) {
        console.log('Processing ' + framework + ':');
        var frameworkLocation = path.join(installedPluginDir, framework);
        var symlinks = frameworks[framework];
        symlinks.forEach(function (symlink) {
            var link = path.join(frameworkLocation, symlink.link);
            if (fs.existsSync(link)) {
                fs.unlinkSync(link);
            }

            console.log('\tRestoring symlink ' + symlink.link);
            fs.symlinkSync(symlink.target, link);
        });
    });
};
