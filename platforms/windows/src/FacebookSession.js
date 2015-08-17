// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved.
// Licensed under the Apache License, Version 2.0.
// See LICENSE in the project root for license information.

/*global Windows, module*/

var Storage = Windows.Storage;
var AppData = Windows.Storage.ApplicationData.current;

/**
 * Encapsulates Facebook session related logic,
 * stores session data automatically in application persistent storage
 * @param {String} facebookAppId Facebook Application ID
 */
var FacebookSession = function (facebookAppId) {
    // Open container and read session data from it
    var container = AppData.localSettings.createContainer(facebookAppId, Storage.ApplicationDataCreateDisposition.always);
    this._container = container;

    for (var value in container.values) {
        if (container.values.hasOwnProperty(value)) {
            this[value] = container.values[value];
        }
    }
};

/**
 * Set properties provided in argument for current session
 * @param {Object} object Set of properties need to applied to current session
 */
FacebookSession.prototype.set = function(object) {
    var container = this._container;
    for (var item in object) {
        if (object.hasOwnProperty(item)) {
            // save each property from source object to current session object and inderlying appdata container
            this[item] = object[item];
            container.values[item] = object[item];
        }
    }
    return this;
};

/**
 * Clean up current session information
 */
FacebookSession.prototype.destroy = function () {
    var appId = this._container.name;
    // Remove all session's properties
    for (var property in this) {
        if (this.hasOwnProperty(property)) {
            delete this[property];
        }
    }
    // Then just delete and recreate session container
    AppData.localSettings.deleteContainer(appId);
    this._container = AppData.localSettings.createContainer(appId, Storage.ApplicationDataCreateDisposition.always);
};

/**
 * Checks if current session is expired
 * @return {Boolean} Returns true if session is active and not expired otherwise false
 */
FacebookSession.prototype.isExpired = function() {
    return !this.active || (this.expiresIn < new Date());
};

/**
 * Checks if any new permissions required to this session
 * @param  {String[]} newPermissions Array of new permissions
 * @return {Boolean}                 True if new permission is required, false otherwise
 */
FacebookSession.prototype.needNewPermissions = function(newPermissions) {

    var newPerm = newPermissions === '' ? [] : newPermissions.split(',');
    // If current session permissions is not set, let it be an empty array
    var existingPerm = (this.permissions || "").split(',');

    // If no permissions given, no need to check at all
    if (newPerm.length > 0) {
        for (var i = 0; i < newPerm.length; i++) {
            var permission = newPerm[i];
            if (existingPerm.indexOf(permission) < 0) {
                return true;
            }
        }
    }
    return false;
};

module.exports = FacebookSession;
