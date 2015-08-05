#!/usr/bin/env node
// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved.
// Licensed under the Apache License, Version 2.0.
// See License.txt in the project root for license information.

var path = require('path'),
    glob = require('glob'),
    et = require('elementtree'),
    fs = require('fs');

var POSSIBLE_SURROGATE_SIZE = 512;
var CHECK_FOR_WINDOWS_SURROGATES = true;

/**
 * Saves metadata for all symlinks inside of iOS custom frameworks if any present in plugin
 * to be able to restore it when application with this plugin installed is being built.
 * This is required for some plugins that uses custom frameworks on iOS (which are heavily
 * depends on symlinks) due to fact that npm doesn't preserves symlinks and removes them
 * at 'package'/'publish' step. See https://issues.apache.org/jira/browse/CB-6092 for details.
 *
 * @param  {String}  packageDirectory   Plugin directory.
 */
function saveCustomFrameworksSymlinksMetadata(packageDirectory) {
    // Find all symlinks within plugin source code and save metadata for them
    // Convert package directory to absolute path to avoid common problems
    packageDirectory = path.resolve(packageDirectory);

    // We need to produce an object with following structure:
    // { <framework_name> : [
    //         { link: <link_source>, target: <link_target> }
    //         <symlink2>
    //         ...
    //     ]
    // }
    var frameworksMetadata =getCustomFrameworks(packageDirectory)
        .reduce(getSymlinksForFramework, {});

    // If no symlinks found (this is probably impossible but still) then just return nothing
    if (frameworksMetadata.length === 0) return;

    var symlinkMetadata = path.join(packageDirectory, 'symlinkmetadata.json');
    fs.writeFileSync(symlinkMetadata, JSON.stringify(frameworksMetadata, null, 4));

    function getSymlinksForFramework (accumulator, framework) {
        var frameworkSource = path.resolve(packageDirectory, framework);
        var possibleLinks = glob.sync(path.join(frameworkSource, '**', '*'));

        var realLinks = possibleLinks
        // First try to get info for all possible symlinks in framework directory
        .map(function (possibleLinkPath) {
            return getSymlinkInfo(possibleLinkPath, frameworkSource);
        })
        // Filter out items that are not symlinks
        .filter(function (symlinkInfo) {
            return symlinkInfo;
        });

        if (realLinks.length > 0) {
            // If there is any symlinks found, create an object, representing
            // symlinks for framework and push it to accumulator.
            accumulator[path.basename(framework)] = realLinks;
        }

        return accumulator;
    }

    function getSymlinkInfo (linkPath, basePath) {
        var possibleSymlinkTarget = checkSymlink(linkPath, CHECK_FOR_WINDOWS_SURROGATES);
        if (possibleSymlinkTarget) {
            // convert link and link's target paths to relative again
            // replace backslashes with forward slashes to prevent cross-platform path issues
            var link = path.relative(basePath, linkPath).replace(/\\/g, '/');
            var target = path.relative(path.dirname(linkPath), possibleSymlinkTarget).replace(/\\/g, '/');
            var linkMetadata = {
                link: link,
                target: target
            };
            // events.emit('verbose', 'Saving restore metadata for link ' + possibleLink + ' ==> ' + target);
            return linkMetadata;
        }
    }
}

/**
 * Checks if provided path is a symlink and if true, returns it's destination.
 * Method can also try to resolve symlink 'surrogates' on windows (text files
 * without an extension, that contains path to linked file)
 *
 * @param {String}  possibleSymlink Path to candidate to be a symlink.
 * @param {Boolean} checkForWindowsSurrogates
 *                           Flag that forces method to check windows 'surrogates' for symlinks
 * @return {String} Absolute path to symlink target or undefined, if provided
 *                           path is not a symlink
 */
function checkSymlink(possibleSymlink, checkForWindowsSurrogates) {
    // To be sure that we're operating by absolute paths
    possibleSymlink = path.resolve(possibleSymlink);

    var stat,
        result;
    try {
        stat = fs.lstatSync(possibleSymlink);
    } catch (e) {
        return;
    }

    function isWindowsSurrogate() {
        return stat.isFile() &&
            stat.size > 0 && stat.size < POSSIBLE_SURROGATE_SIZE &&
            path.extname(possibleSymlink) === '';
    }

    if (stat.isSymbolicLink()) {
        result = fs.realpathSync(possibleSymlink);
    } else if (checkForWindowsSurrogates && isWindowsSurrogate()) {
        var possibleSymlinkContent = fs.readFileSync(possibleSymlink, 'utf8');
        // Need to add '..' path here since surrogate content
        // references to file/folder relative to symlink's parent
        var possibleSymlinkDestination = path.resolve(possibleSymlink, '..', possibleSymlinkContent);
        if (fs.existsSync(possibleSymlinkDestination)) {
            result = possibleSymlinkDestination;
        }
    }

    return result;
}

/**
 * Searches plugin.xml in package folder for ios custom frameworks (<framework custom="true">)
 *
 * @param  {String} packageDirectory Path to directory that contains plugin.xml file
 * @return {String[]}                Array of custom frameworks sources (value of 'src' attribute)
 */
function getCustomFrameworks(packageDirectory) {
    var pluginXml = path.join(packageDirectory, 'plugin.xml');
    if (!fs.existsSync(pluginXml))
        throw new Error('The provided directory doesn\'t contains plugin definition.');

    var contents = fs.readFileSync(pluginXml, 'utf-8');
    if(contents) {
        //Windows is the BOM. Skip the Byte Order Mark.
        contents =  contents.substring(contents.indexOf('<'));
    }

    var pluginXmlTree = new et.ElementTree(et.XML(contents));

    return pluginXmlTree
    .findall('./platform[@name="ios"]/framework[@custom="true"]')
    .map(function (frameworkElement) {
        return frameworkElement.attrib.src;
    });
}

saveCustomFrameworksSymlinksMetadata('.');
