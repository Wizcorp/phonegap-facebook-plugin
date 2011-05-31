
/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * The order of events during page load and PhoneGap startup is as follows:
 *
 * onDOMContentLoaded         Internal event that is received when the web page is loaded and parsed.
 * window.onload              Body onload event.
 * onNativeReady              Internal event that indicates the PhoneGap native side is ready.
 * onPhoneGapInit             Internal event that kicks off creation of all PhoneGap JavaScript objects (runs constructors).
 * onPhoneGapReady            Internal event fired when all PhoneGap JavaScript objects have been created
 * onPhoneGapInfoReady        Internal event fired when device properties are available
 * onDeviceReady              User event fired to indicate that PhoneGap is ready
 * onResume                   User event fired to indicate a start/resume lifecycle event
 *
 * The only PhoneGap events that user code should register for are:
 *      onDeviceReady
 *      onResume
 *
 * Listeners can be registered as:
 *      document.addEventListener("deviceready", myDeviceReadyListener, false);
 *      document.addEventListener("resume", myResumeListener, false);
 */

/**
 * This represents the PhoneGap API itself, and provides a global namespace for accessing
 * information about the state of PhoneGap.
 * @class
 */
PhoneGap = { };

/**
 * Custom pub-sub channel that can have functions subscribed to it
 */
PhoneGap.Channel = function(type)
{
    this.type = type;
    this.handlers = {};
    this.guid = 0;
    this.fired = false;
    this.enabled = true;
};

/**
 * Subscribes the given function to the channel. Any time that 
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
PhoneGap.Channel.prototype.subscribe = function(f, c, g) {
    // need a function to call
    if (f == null) { return; }

    var func = f;
    if (typeof c == "object" && f instanceof Function) { func = PhoneGap.close(c, f); }

    g = g || func.observer_guid || f.observer_guid || this.guid++;
    func.observer_guid = g;
    f.observer_guid = g;
    this.handlers[g] = func;
    return g;
};

/**
 * Like subscribe but the function is only called once and then it
 * auto-unsubscribes itself.
 */
PhoneGap.Channel.prototype.subscribeOnce = function(f, c) {
    var g = null;
    var _this = this;
    var m = function() {
        f.apply(c || null, arguments);
        _this.unsubscribe(g);
    }
    if (this.fired) {
        if (typeof c == "object" && f instanceof Function) { f = PhoneGap.close(c, f); }
        f.apply(this, this.fireArgs);
    } else {
        g = this.subscribe(m);
    }
    return g;
};

/** 
 * Unsubscribes the function with the given guid from the channel.
 */
PhoneGap.Channel.prototype.unsubscribe = function(g) {
    if (g instanceof Function) { g = g.observer_guid; }
    this.handlers[g] = null;
    delete this.handlers[g];
};

/** 
 * Calls all functions subscribed to this channel.
 */
PhoneGap.Channel.prototype.fire = function(e) {
    if (this.enabled) {
        var fail = false;
        for (var item in this.handlers) {
            var handler = this.handlers[item];
            if (handler instanceof Function) {
                var rv = (handler.apply(this, arguments)==false);
                fail = fail || rv;
            }
        }
        this.fired = true;
        this.fireArgs = arguments;
        return !fail;
    }
    return true;
};

/**
 * Calls the provided function only after all of the channels specified
 * have been fired.
 */
PhoneGap.Channel.join = function(h, c) {
    var i = c.length;
    var f = function() {
        if (!(--i)) h();
    }
    for (var j=0; j<i; j++) {
        (!c[j].fired?c[j].subscribeOnce(f):i--);
    }
    if (!i) h();
};

/**
 * Add an initialization function to a queue that ensures it will run and initialize
 * application constructors only once PhoneGap has been initialized.
 * @param {Function} func The function callback you want run once PhoneGap is initialized
 */
PhoneGap.addConstructor = function(func) {
    PhoneGap.onPhoneGapInit.subscribeOnce(function() {
        try {
            func();
        } catch(e) {
            if (typeof(debug['log']) == 'function') {
                debug.log("Failed to run constructor: " + debug.processMessage(e));
            } else {
                alert("Failed to run constructor: " + e.message);
            }
        }
    });
};

/**
 * Plugins object.
 */
if (!window.plugins) {
    window.plugins = {};
}

/**
 * Adds new plugin object to window.plugins.
 * The plugin is accessed using window.plugins.<name>
 * 
 * @param name      The plugin name
 * @param obj       The plugin object
 */
PhoneGap.addPlugin = function(name, obj) {
    if (!window.plugins[name]) {
        window.plugins[name] = obj;
    }
    else {
        console.log("Plugin " + name + " already exists.");
    }
};

/**
 * onDOMContentLoaded channel is fired when the DOM content 
 * of the page has been parsed.
 */
PhoneGap.onDOMContentLoaded = new PhoneGap.Channel('onDOMContentLoaded');

/**
 * onNativeReady channel is fired when the PhoneGap native code
 * has been initialized.
 */
PhoneGap.onNativeReady = new PhoneGap.Channel('onNativeReady');

/**
 * onPhoneGapInit channel is fired when the web page is fully loaded and
 * PhoneGap native code has been initialized.
 */
PhoneGap.onPhoneGapInit = new PhoneGap.Channel('onPhoneGapInit');

/**
 * onPhoneGapReady channel is fired when the JS PhoneGap objects have been created.
 */
PhoneGap.onPhoneGapReady = new PhoneGap.Channel('onPhoneGapReady');

/**
 * onPhoneGapInfoReady channel is fired when the PhoneGap device properties
 * has been set.
 */
PhoneGap.onPhoneGapInfoReady = new PhoneGap.Channel('onPhoneGapInfoReady');

/**
 * onResume channel is fired when the PhoneGap native code
 * resumes.
 */
PhoneGap.onResume = new PhoneGap.Channel('onResume');

/**
 * onPause channel is fired when the PhoneGap native code
 * pauses.
 */
PhoneGap.onPause = new PhoneGap.Channel('onPause');

/**
 * When BlackBerry WebWorks application is brought to foreground, 
 * fire onResume event.
 */
blackberry.app.event.onForeground(function() {
    PhoneGap.onResume.fire();
});

/**
 * When BlackBerry WebWorks application is sent to background, 
 * fire onPause event.
 */
blackberry.app.event.onBackground(function() {
   PhoneGap.onPause.fire();
});

/**
 * Trap BlackBerry WebWorks exit. Fire onPause event, and give PhoneGap
 * extension chance to clean up before exiting.
 */
blackberry.app.event.onExit(function() {
    PhoneGap.onPause.fire();

    // allow PhoneGap JavaScript Extension opportunity to cleanup
    phonegap.PluginManager.destroy();
    
    // exit the app
    blackberry.app.exit();
});

// _nativeReady is global variable that the native side can set
// to signify that the native code is ready. It is a global since 
// it may be called before any PhoneGap JS is ready.
if (typeof _nativeReady !== 'undefined') { PhoneGap.onNativeReady.fire(); }

/**
 * onDeviceReady is fired only after all PhoneGap objects are created and
 * the device properties are set.
 */
PhoneGap.onDeviceReady = new PhoneGap.Channel('onDeviceReady');

/**
 * Create all PhoneGap objects once page has fully loaded and native side is ready.
 */
PhoneGap.Channel.join(function() {

    // Run PhoneGap constructors
    PhoneGap.onPhoneGapInit.fire();

    // Fire event to notify that all objects are created
    PhoneGap.onPhoneGapReady.fire();

}, [ PhoneGap.onDOMContentLoaded, PhoneGap.onNativeReady ]);

/**
 * Fire onDeviceReady event once all constructors have run and PhoneGap info has been
 * received from native side.
 */
PhoneGap.Channel.join(function() {
    PhoneGap.onDeviceReady.fire();
    
    // Fire the onresume event, since first one happens before JavaScript is loaded
    PhoneGap.onResume.fire();
}, [ PhoneGap.onPhoneGapReady, PhoneGap.onPhoneGapInfoReady]);

// Listen for DOMContentLoaded and notify our channel subscribers
document.addEventListener('DOMContentLoaded', function() {
    PhoneGap.onDOMContentLoaded.fire();
}, false);

// Intercept calls to document.addEventListener and watch for deviceready
PhoneGap.m_document_addEventListener = document.addEventListener;

document.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (e == 'deviceready') {
        PhoneGap.onDeviceReady.subscribeOnce(handler);
    } else if (e == 'resume') {
        PhoneGap.onResume.subscribe(handler);
        // if subscribing listener after event has already fired, invoke the handler
        if (PhoneGap.onResume.fired && handler instanceof Function) {
            handler();
        }
    } else if (e == 'pause') {
        PhoneGap.onPause.subscribe(handler);
    } else {
        PhoneGap.m_document_addEventListener.call(document, evt, handler, capture);
    }
};

PhoneGap.m_element_addEventListener = Element.prototype.addEventListener;

/**
 * For BlackBerry, the touchstart event does not work so we need to do click
 * events when touchstart events are attached.
 */
Element.prototype.addEventListener = function(evt, handler, capture) {
    if (evt === 'touchstart') {
        evt = 'click';
    }
    PhoneGap.m_element_addEventListener.call(this, evt, handler, capture);
};

/**
 * Does a deep clone of the object.
 *
 * @param obj
 * @return
 */
PhoneGap.clone = function(obj) {
    if(!obj) { 
        return obj;
    }
    
    if(obj instanceof Array){
        var retVal = new Array();
        for(var i = 0; i < obj.length; ++i){
            retVal.push(PhoneGap.clone(obj[i]));
        }
        return retVal;
    }
    
    if (obj instanceof Function) {
        return obj;
    }
    
    if(!(obj instanceof Object)){
        return obj;
    }
    
    if(obj instanceof Date){
        return obj;
    }

    retVal = new Object();
    for(i in obj){
        if(!(i in retVal) || retVal[i] != obj[i]) {
            retVal[i] = PhoneGap.clone(obj[i]);
        }
    }
    return retVal;
};

PhoneGap.close = function(context, func, params) {
    if (typeof params === 'undefined') {
        return function() {
            return func.apply(context, arguments);
        }
    } else {
        return function() {
            return func.apply(context, params);
        }
    }
};

PhoneGap.callbackId = 0;
PhoneGap.callbacks  = {};
PhoneGap.callbackStatus = {
    NO_RESULT: 0,
    OK: 1,
    CLASS_NOT_FOUND_EXCEPTION: 2,
    ILLEGAL_ACCESS_EXCEPTION: 3,
    INSTANTIATION_EXCEPTION: 4,
    MALFORMED_URL_EXCEPTION: 5,
    IO_EXCEPTION: 6,
    INVALID_ACTION: 7,
    JSON_EXCEPTION: 8,
    ERROR: 9
};

/**
 * Called by native code when returning successful result from an action.
 *
 * @param callbackId
 * @param args
 */
PhoneGap.callbackSuccess = function(callbackId, args) {
    if (PhoneGap.callbacks[callbackId]) {

        // If result is to be sent to callback
        if (args.status == PhoneGap.callbackStatus.OK) {
            try {
                if (PhoneGap.callbacks[callbackId].success) {
                    PhoneGap.callbacks[callbackId].success(args.message);
                }
            }
            catch (e) {
                console.log("Error in success callback: "+callbackId+" = "+e);
            }
        }

        // Clear callback if not expecting any more results
        if (!args.keepCallback) {
            delete PhoneGap.callbacks[callbackId];
        }
    }
};

/**
 * Called by native code when returning error result from an action.
 *
 * @param callbackId
 * @param args
 */
PhoneGap.callbackError = function(callbackId, args) {
    if (PhoneGap.callbacks[callbackId]) {
        try {
            if (PhoneGap.callbacks[callbackId].fail) {
                PhoneGap.callbacks[callbackId].fail(args.message);
            }
        }
        catch (e) {
            console.log("Error in error callback: "+callbackId+" = "+e);
        }

        // Clear callback if not expecting any more results
        if (!args.keepCallback) {
            delete PhoneGap.callbacks[callbackId];
        }
    }
};

/**
 * Execute a PhoneGap command.  It is up to the native side whether this action is sync or async.  
 * The native side can return:
 *      Synchronous: PluginResult object as a JSON string
 *      Asynchrounous: Empty string ""
 * If async, the native side will PhoneGap.callbackSuccess or PhoneGap.callbackError,
 * depending upon the result of the action.
 *
 * @param {Function} success    The success callback
 * @param {Function} fail       The fail callback
 * @param {String} service      The name of the service to use
 * @param {String} action       Action to be run in PhoneGap
 * @param {String[]} [args]     Zero or more arguments to pass to the method
 */
PhoneGap.exec = function(success, fail, service, action, args) {
    try {
        var callbackId = service + PhoneGap.callbackId++;
        if (success || fail) {
            PhoneGap.callbacks[callbackId] = {success:success, fail:fail};
        }
        
        // Note: Device returns string, but for some reason emulator returns object - so convert to string.
        var r = ""+phonegap.PluginManager.exec(service, action, callbackId, JSON.stringify(args), true);
        
        // If a result was returned
        if (r.length > 0) {
            eval("var v="+r+";");
        
            // If status is OK, then return value back to caller
            if (v.status == PhoneGap.callbackStatus.OK) {

                // If there is a success callback, then call it now with returned value
                if (success) {
                    try {
                        success(v.message);
                    }
                    catch (e) {
                        console.log("Error in success callback: "+callbackId+" = "+e);
                    }

                    // Clear callback if not expecting any more results
                    if (!v.keepCallback) {
                        delete PhoneGap.callbacks[callbackId];
                    }
                }
                return v.message;
            }
            // If no result
            else if (v.status == PhoneGap.callbackStatus.NO_RESULT) {
                    
                // Clear callback if not expecting any more results
                if (!v.keepCallback) {
                    delete PhoneGap.callbacks[callbackId];
                }
            }
            // If error, then display error
            else {
                console.log("Error: Status="+r.status+" Message="+v.message);

                // If there is a fail callback, then call it now with returned value
                if (fail) {
                    try {
                        fail(v.message);
                    }
                    catch (e) {
                        console.log("Error in error callback: "+callbackId+" = "+e);
                    }

                    // Clear callback if not expecting any more results
                    if (!v.keepCallback) {
                        delete PhoneGap.callbacks[callbackId];
                    }
                }
                return null;
            }
        }
    } catch (e) {
        console.log("Error: "+e);
    }
};

/**
 * Create a UUID
 *
 * @return
 */
PhoneGap.createUUID = function() {
    return PhoneGap.UUIDcreatePart(4) + '-' +
        PhoneGap.UUIDcreatePart(2) + '-' +
        PhoneGap.UUIDcreatePart(2) + '-' +
        PhoneGap.UUIDcreatePart(2) + '-' +
        PhoneGap.UUIDcreatePart(6);
};

PhoneGap.UUIDcreatePart = function(length) {
    var uuidpart = "";
    for (var i=0; i<length; i++) {
        var uuidchar = parseInt((Math.random() * 256)).toString(16);
        if (uuidchar.length == 1) {
            uuidchar = "0" + uuidchar;
        }
        uuidpart += uuidchar;
    }
    return uuidpart;
};

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */
function Acceleration(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.timestamp = new Date().getTime();
};

/**
 * This class provides access to device accelerometer data.
 * @constructor
 */
function Accelerometer() {

    /**
     * The last known acceleration.  type=Acceleration()
     */
    this.lastAcceleration = null;

    /**
     * List of accelerometer watch timers
     */
    this.timers = {};
};

/**
 * Asynchronously acquires the current acceleration.
 *
 * @param {Function} successCallback    The function to call when the acceleration data is available
 * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
 * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
 */
Accelerometer.prototype.getCurrentAcceleration = function(successCallback, errorCallback, options) {

    // successCallback required
    if (typeof successCallback != "function") {
        console.log("Accelerometer Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback != "function")) {
        console.log("Accelerometer Error: errorCallback is not a function");
        return;
    }

    // Get acceleration
    PhoneGap.exec(successCallback, errorCallback, "Accelerometer", "getAcceleration", []);
};

/**
 * Asynchronously acquires the device acceleration at a given interval.
 *
 * @param {Function} successCallback    The function to call each time the acceleration data is available
 * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
 * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
 * @return String                       The watch id that must be passed to #clearWatch to stop watching.
 */
Accelerometer.prototype.watchAcceleration = function(successCallback, errorCallback, options) {

    // Default interval (10 sec)
    var frequency = (options != undefined)? options.frequency : 10000;

    // successCallback required
    if (typeof successCallback != "function") {
        console.log("Accelerometer Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback != "function")) {
        console.log("Accelerometer Error: errorCallback is not a function");
        return;
    }

    // Make sure accelerometer timeout > frequency + 10 sec
    PhoneGap.exec(
        function(timeout) {
            if (timeout < (frequency + 10000)) {
                PhoneGap.exec(null, null, "Accelerometer", "setTimeout", [frequency + 10000]);
            }
        },
        function(e) { }, "Accelerometer", "getTimeout", []);

    // Start watch timer
    var id = PhoneGap.createUUID();
    navigator.accelerometer.timers[id] = setInterval(function() {
        PhoneGap.exec(successCallback, errorCallback, "Accelerometer", "getAcceleration", []);
    }, (frequency ? frequency : 1));

    return id;
};

/**
 * Clears the specified accelerometer watch.
 *
 * @param {String} id The id of the watch returned from #watchAcceleration.
 */
Accelerometer.prototype.clearWatch = function(id) {

    // Stop javascript timer & remove from timer list
    if (id && navigator.accelerometer.timers[id] != undefined) {
        clearInterval(navigator.accelerometer.timers[id]);
        delete navigator.accelerometer.timers[id];
    }
};

PhoneGap.addConstructor(function() {
    if (typeof navigator.accelerometer == "undefined") navigator.accelerometer = new Accelerometer();
});

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * This class provides access to the device camera.
 *
 * @constructor
 */
Camera = function() {
    this.successCallback = null;
    this.errorCallback = null;
    this.options = null;
};

/**
 * Format of image that returned from getPicture.
 *
 * Example: navigator.camera.getPicture(success, fail,
 *              { quality: 80,
 *                destinationType: Camera.DestinationType.DATA_URL,
 *                sourceType: Camera.PictureSourceType.PHOTOLIBRARY})
 */
Camera.DestinationType = {
    DATA_URL: 0,                // Return base64 encoded string
    FILE_URI: 1                 // Return file URI
};
Camera.prototype.DestinationType = Camera.DestinationType;

/**
 * Source to getPicture from.
 *
 * Example: navigator.camera.getPicture(success, fail,
 *              { quality: 80,
 *                destinationType: Camera.DestinationType.DATA_URL,
 *                sourceType: Camera.PictureSourceType.PHOTOLIBRARY})
 */
Camera.PictureSourceType = {    // Ignored on Blackberry
    PHOTOLIBRARY : 0,           // Choose image from picture library 
    CAMERA : 1,                 // Take picture from camera
    SAVEDPHOTOALBUM : 2         // Choose image from picture library 
};
Camera.prototype.PictureSourceType = Camera.PictureSourceType;

/**
 * Gets a picture from source defined by "options.sourceType", and returns the
 * image as defined by the "options.destinationType" option.

 * The defaults are sourceType=CAMERA and destinationType=DATA_URL.
 *
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @param {Object} options
 */
Camera.prototype.getPicture = function(successCallback, errorCallback, options) {

    // successCallback required
    if (typeof successCallback != "function") {
        console.log("Camera Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback != "function")) {
        console.log("Camera Error: errorCallback is not a function");
        return;
    }

    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.options = options;
    var quality = 80;
    if (options.quality) {
        quality = this.options.quality;
    }
    var destinationType = Camera.DestinationType.DATA_URL;
    if (this.options.destinationType) {
        destinationType = this.options.destinationType;
    }
    var sourceType = Camera.PictureSourceType.CAMERA;
    if (typeof this.options.sourceType == "number") {
        sourceType = this.options.sourceType;
    }
    PhoneGap.exec(successCallback, errorCallback, "Camera", "takePicture", [quality, destinationType, sourceType]);
};

PhoneGap.addConstructor(function() {
	if (typeof navigator.camera == "undefined") navigator.camera = new Camera();
});
/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * phonegap.Logger is a Blackberry Widget extension that will log to the 
 * BB Event Log and System.out.  Comment this line to disable.
 */ 
phonegap.Logger.enable();

/**
 * If Blackberry doesn't define a console object, we create our own.
 * console.log will use phonegap.Logger to log to BB Event Log and System.out.
 * Optionally, use <div/> console output for in-your-face debugging :)
 */
if (typeof console == "undefined") {    
    console = {};
}
console.log = function(msg) {
    phonegap.Logger.log(msg);
};

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * Contains information about a single contact.  
 * @param {DOMString} id unique identifier
 * @param {DOMString} displayName
 * @param {ContactName} name 
 * @param {DOMString} nickname
 * @param {ContactField[]} phoneNumbers array of phone numbers
 * @param {ContactField[]} emails array of email addresses
 * @param {ContactAddress[]} addresses array of addresses
 * @param {ContactField[]} ims instant messaging user ids
 * @param {ContactOrganization[]} organizations 
 * @param {DOMString} revision date contact was last updated
 * @param {Date} birthday contact's birthday
 * @param {DOMString} gender contact's gender
 * @param {DOMString} note user notes about contact
 * @param {ContactField[]} photos
 * @param {DOMString[]} categories 
 * @param {ContactField[]} urls contact's web sites
 * @param {DOMString} timezone time zone 
 */
var Contact = function(id, displayName, name, nickname, phoneNumbers, emails, addresses,
    ims, organizations, revision, birthday, gender, note, photos, categories, urls, timezone) {
    this.id = id || null;
    this.displayName = displayName || null;
    this.name = name || null; // ContactName
    this.nickname = nickname || null;
    this.phoneNumbers = phoneNumbers || null; // ContactField[]
    this.emails = emails || null; // ContactField[]
    this.addresses = addresses || null; // ContactAddress[]
    this.ims = ims || null; // ContactField[]
    this.organizations = organizations || null; // ContactOrganization[]
    this.revision = revision || null;
    this.birthday = birthday || null;
    this.gender = gender || null;
    this.note = note || null;
    this.photos = photos || null; // ContactField[]
    this.categories = categories || null; // DOMString[]
    this.urls = urls || null; // ContactField[]
    this.timezone = timezone;
};

/**
 * Contact name.
 * @param formatted full name formatted for display
 * @param familyName family or last name
 * @param givenName given or first name
 * @param middle middle name
 * @param prefix honorific prefix or title
 * @param suffix honorific suffix
 */
var ContactName = function(formatted, familyName, givenName, middle, prefix, suffix) {
    this.formatted = formatted || null;
    this.familyName = familyName || null;
    this.givenName = givenName || null;
    this.middleName = middle || null;
    this.honorificPrefix = prefix || null;
    this.honorificSuffix = suffix || null;
};

/**
 * Generic contact field.
 * @param type contains the type of information for this field, e.g. 'home', 'mobile'
 * @param value contains the value of this field
 * @param pref indicates whether this instance is preferred 
 */
var ContactField = function(type, value, pref) {
    this.type = type || null;
    this.value = value || null;
    this.pref = pref || false;
};

/**
 * Contact address.
 * @param formatted full physical address, formatted for display
 * @param streetAddress street address
 * @param locality locality or city
 * @param region region or state
 * @param postalCode postal or zip code
 * @param country country name
 */
var ContactAddress = function(formatted, streetAddress, locality, region, postalCode, country) {
    this.formatted = formatted || null;
    this.streetAddress = streetAddress || null;
    this.locality = locality || null;
    this.region = region || null;
    this.postalCode = postalCode || null;
    this.country = country || null;
};

/**
 * Contact organization.
 * @param name name of organization
 * @param dept department
 * @param title job title
 */
var ContactOrganization = function(name, dept, title) {
    this.name = name || null;
    this.department = dept || null;
    this.title = title || null;
};

/**
 * Represents a group of Contacts. 
 */
var Contacts = function() {
    this.inProgress = false;
    this.records = [];
};

var ContactError = function(code) {
    this.code = code;
};

ContactError.UNKNOWN_ERROR = 0;
ContactError.INVALID_ARGUMENT_ERROR = 1;
ContactError.NOT_FOUND_ERROR = 2;
ContactError.TIMEOUT_ERROR = 3;
ContactError.PENDING_OPERATION_ERROR = 4;
ContactError.IO_ERROR = 5;
ContactError.NOT_SUPPORTED_ERROR = 6;
ContactError.PERMISSION_DENIED_ERROR = 20;

/**
 * This function creates a new contact, but it does not persist the contact
 * to device storage.  To persist the contact to device storage, invoke
 * <code>contact.save()</code>.
 */
Contacts.prototype.create = function(properties) {
    var contact = new Contact();
    for (var i in properties) {
        if (contact[i] !== 'undefined') {
            contact[i] = properties[i];
        }
    }
    return contact;
};

/**
 * Persists contact to device storage.
 */
Contact.prototype.save = function(success, fail) {
    
    try {
        // save the contact and store it's unique id
        this.id = BlackBerryContacts.saveToDevice(this);        
        if (success) {
            success(this);
        }
    } catch (e) {
        console.log('Error saving contact: ' + e);
        if (fail) {
            fail(new ContactError(ContactError.UNKNOWN_ERROR));
        }
    }
};

/**
 * Removes contact from device storage.
 * @param success success callback
 * @param fail error callback
 */
Contact.prototype.remove = function(success, fail) {

    try {
        // retrieve contact from device by id
        var bbContact = null;
        if (this.id) {
            bbContact = BlackBerryContacts.findByUniqueId(this.id);
        }
        
        // if contact was found, remove it
        if (bbContact) {
            console.log('removing contact: ' + bbContact.uid);
            bbContact.remove();
            if (success) {
                success(this);
            }
        }
        // attempting to remove a contact that hasn't been saved
        else if (fail) { 
            fail(new ContactError(ContactError.NOT_FOUND_ERROR));            
        }
    } 
    catch (e) {
        console.log('Error removing contact ' + this.id + ": " + e);
        if (fail) { 
            fail(new ContactError(ContactError.UNKNOWN_ERROR));
        }
    }
};

/**
 * Creates a deep copy of this Contact.
 * @return copy of this Contact
 */
Contact.prototype.clone = function() {
    var clonedContact = PhoneGap.clone(this);
    clonedContact.id = null;
    return clonedContact;
};

/**
 * Returns an array of Contacts matching the search criteria.
 * @return array of Contacts matching search criteria
 */
Contacts.prototype.find = function(fields, success, fail, options) {

    // default is to return multiple contacts (-1 on BlackBerry)
    var numContacts = -1;

    // search options
    var filter = null;
    if (options) {
        // return multiple objects?
        if (options.multiple === false) {
            numContacts = 1;
        }
        filter = options.filter;
    }
    
    // build the filter expression to use in find operation 
    var filterExpression = BlackBerryContacts.buildFilterExpression(fields, filter); 

    // find matching contacts
    // Note: the filter expression can be null here, in which case, the find won't filter
    var bbContacts = blackberry.pim.Contact.find(filterExpression, null, numContacts);
    
    // convert to Contact from blackberry.pim.Contact
    var contacts = [];
    for (var i in bbContacts) {
        if (bbContacts[i]) { 
            // W3C Contacts API specification states that only the fields
            // in the search filter should be returned, so we create 
            // a new Contact object, copying only the fields specified
            contacts.push(BlackBerryContacts.createContact(bbContacts[i], fields));
        }
    }
    
    // return results
    if (success && success instanceof Function) {
        success(contacts);
    } else {
        console.log("Error invoking Contacts.find success callback.");
    }
};

/**
 * Contact search criteria.
 * @param filter string-based search filter with which to search and filter contacts
 * @param multiple indicates whether multiple contacts should be returned (defaults to true)
 * @param updatedSince return only records that have been updated after the specified timm
 */
var ContactFindOptions = function(filter, multiple, updatedSince) {
    this.filter = filter || '';
    this.multiple = multiple || true;
    this.updatedSince = updatedSince || '';
};

PhoneGap.addConstructor(function() {
    if(typeof navigator.service === "undefined") navigator.service = new Object();
    if(typeof navigator.service.contacts === "undefined") navigator.service.contacts = new Contacts();
});

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * The BlackBerryContacts class contains functionality that is specific to 
 * BlackBerry Widget Contacts. 
 */
var BlackBerryContacts = function() {

    // Mappings for each Contact field that may be used in a find operation. 
    // Contains all Contact fields that map to one or more fields in a BlackBerry 
    // contact object.
    // 
    // Example: user searches with a filter on the Contact 'name' field:
    //
    // <code>Contacts.find(['name'], onSuccess, onFail, {filter:'Bob'});</code>
    // 
    // The 'name' field does not exist in a BlackBerry contact.  Instead, a
    // filter expression will be built to search the BlackBerry contacts using
    // the BlackBerry 'title', 'firstName' and 'lastName' fields.   
    //
    this.fieldMappings = {
         "id"                        : "uid",
         "displayName"               : "user1", 
         "name"                      : [ "title", "firstName", "lastName" ],
         "name.formatted"            : [ "title", "firstName", "lastName" ],
         "name.givenName"            : "firstName",
         "name.familyName"           : "lastName",
         "name.honorificPrefix"      : "title",
         "phoneNumbers"              : [ "faxPhone", "homePhone", "homePhone2", 
                                         "mobilePhone", "pagerPhone", "otherPhone",
                                         "workPhone", "workPhone2" ],
         "phoneNumbers.value"        : [ "faxPhone", "homePhone", "homePhone2", 
                                         "mobilePhone", "pagerPhone", "otherPhone",
                                         "workPhone", "workPhone2" ],
         "emails"                    : [ "email1", "email2", "email3" ],
         "addresses"                 : [ "homeAddress.address1", "homeAddress.address2",
                                         "homeAddress.city", "homeAddress.stateProvince",
                                         "homeAddress.zipPostal", "homeAddress.country",
                                         "workAddress.address1", "workAddress.address2",
                                         "workAddress.city", "workAddress.stateProvince",
                                         "workAddress.zipPostal", "workAddress.country" ],
         "addresses.formatted"       : [ "homeAddress.address1", "homeAddress.address2",
                                         "homeAddress.city", "homeAddress.stateProvince",
                                         "homeAddress.zipPostal", "homeAddress.country",
                                         "workAddress.address1", "workAddress.address2",
                                         "workAddress.city", "workAddress.stateProvince",
                                         "workAddress.zipPostal", "workAddress.country" ],
         "addresses.streetAddress"   : [ "homeAddress.address1", "homeAddress.address2",
                                         "workAddress.address1", "workAddress.address2" ],
         "addresses.locality"        : [ "homeAddress.city", "workAddress.city" ],
         "addresses.region"          : [ "homeAddress.stateProvince", "workAddress.stateProvince" ],
         "addresses.country"         : [ "homeAddress.country", "workAddress.country" ],
         "organizations"             : [ "company", "jobTitle" ],
         "organizations.name"        : "company",
         "organizations.title"       : "jobTitle",
         "birthday"                  : "birthday",
         "note"                      : "note",
         "categories"                : "categories",
         "urls"                      : "webpage",
         "urls.value"                : "webpage"
  }
};

/**
 * Retrieves a BlackBerry contact from the device by unique id.
 * @param uid Unique id of the contact on the device
 * @return {blackberry.pim.Contact} BlackBerry contact or null if contact with specified id is not found
 */
BlackBerryContacts.findByUniqueId = function(uid) {
    if (!uid) {
        return null;
    }
    var bbContacts = blackberry.pim.Contact.find(
            new blackberry.find.FilterExpression("uid", "==", uid));
    return bbContacts[0] || null;
};

/**
 * Creates a BlackBerry contact object from the specified Contact object 
 * and persists it to device storage.
 * @param {Contact} contact The contact to save
 * @return id of the saved contact
 */
BlackBerryContacts.saveToDevice = function(contact) {

    if (!contact) {
        return;
    }
    
    var bbContact = null;
    var update = false;

    // if the underlying BlackBerry contact already exists, retrieve it for update
    if (contact.id) {
        // we must attempt to retrieve the BlackBerry contact from the device 
        // because this may be an update operation
        bbContact = BlackBerryContacts.findByUniqueId(contact.id);
    }
    
    // contact not found on device, create a new one
    if (!bbContact) {
        bbContact = new blackberry.pim.Contact();
    }
    // update the existing contact
    else {
        update = true;
    }
    
    // NOTE: The user may be working with a partial Contact object, because only
    // user-specified Contact fields are returned from a find operation (blame 
    // the W3C spec).  If this is an update to an existing Contact, we don't 
    // want to clear an attribute from the contact database simply because the 
    // Contact object that the user passed in contains a null value for that
    // attribute.  So we only copy the non-null Contact attributes to the 
    // BlackBerry contact object before saving.
    //
    // This means that a user must explicitly set a Contact attribute to a 
    // non-null value in order to update it in the contact database.
    //
    // name
    if (contact.name !== null) {   
        if (contact.name.givenName !== null) {
            bbContact.firstName = contact.name.givenName;
        }
        if (contact.name.familyName !== null) {
            bbContact.lastName = contact.name.familyName;
        }
        if (contact.name.honorificPrefix !== null) {
            bbContact.title = contact.name.honorificPrefix;
        }
    }
    
    // display name
    if (contact.displayName !== null) {
        bbContact.user1 = contact.displayName;
    }
    
    // note
    if (contact.note !== null) {
        bbContact.note = contact.note;
    }

    // birthday
    //
    // user may pass in Date object or a string representation of a date 
    // if it is a string, we don't know the date format, so try to create a
    // new Date with what we're given
    // 
    // NOTE: BlackBerry's Date.parse() does not work well, so use new Date()
    //
    if (contact.birthday !== null) {
        if (contact.birthday instanceof Date) {
            bbContact.birthday = contact.birthday;
        } else {
            var bday = contact.birthday.toString();
            bbContact.birthday = (bday.length > 0) ? new Date(bday) : "";
        }
    }

    // BlackBerry supports three email addresses
    if (contact.emails && contact.emails instanceof Array) {
        
        // if this is an update, re-initialize email addresses
        if (update) {
            bbContact.email1 = "";
            bbContact.email2 = "";
            bbContact.email3 = "";
        }
        
        // copy the first three email addresses found
        var email = null;
        for (var i=0; i<contact.emails.length; i+=1) {
            email = contact.emails[i];
            if (!email || !email.value) { 
                continue; 
            }
            if (bbContact.email1 === "") {
                bbContact.email1 = email.value;
            }
            else if (bbContact.email2 === "") {
                bbContact.email2 = email.value;
            }
            else if (bbContact.email3 === "") {
                bbContact.email3 = email.value;
            }
        }
    }

    // BlackBerry supports a finite number of phone numbers
    // copy into appropriate fields based on type
    if (contact.phoneNumbers && contact.phoneNumbers instanceof Array) {

        // if this is an update, re-initialize phone numbers
        if (update) {
            bbContact.homePhone = "";
            bbContact.homePhone2 = "";
            bbContact.workPhone = "";
            bbContact.workPhone2 = "";
            bbContact.mobilePhone = "";
            bbContact.faxPhone = "";
            bbContact.pagerPhone = "";
            bbContact.otherPhone = "";
        }        
        
        var type = null;
        var number = null;
        for (var i=0; i<contact.phoneNumbers.length; i+=1) {
            if (!contact.phoneNumbers[i] || !contact.phoneNumbers[i].value) { 
                continue; 
            }
            type = contact.phoneNumbers[i].type;
            number = contact.phoneNumbers[i].value;
            if (type === 'home') {
                if (bbContact.homePhone === "") { 
                    bbContact.homePhone = number; 
                }
                else if (bbContact.homePhone2 === "") { 
                    bbContact.homePhone2 = number; 
                }
            } else if (type === 'work') {
                if (bbContact.workPhone === "") { 
                    bbContact.workPhone = number; 
                }
                else if (bbContact.workPhone2 === "") { 
                    bbContact.workPhone2 = number; 
                }
            } else if (type === 'mobile' && bbContact.mobilePhone === "") {
                bbContact.mobilePhone = number;
            } else if (type === 'fax' && bbContact.faxPhone === "") {
                bbContact.faxPhone = number;
            } else if (type === 'pager' && bbContact.pagerPhone === "") {
                bbContact.pagerPhone = number;
            } else if (bbContact.otherPhone === "") {
                bbContact.otherPhone = number;
            }
        }
    }
    
    // BlackBerry supports two addresses: home and work
    // copy the first two addresses found from Contact
    if (contact.addresses && contact.addresses instanceof Array) {
        
        // if this is an update, re-initialize addresses
        if (update) {
            bbContact.homeAddress = null;
            bbContact.workAddress = null;
        }
        
        var address = null;
        var bbHomeAddress = null;
        var bbWorkAddress = null;
        for (var i=0; i<contact.addresses.length; i+=1) {
            address = contact.addresses[i];
            if (!address || address instanceof ContactAddress === false) {
                continue; 
            }
            
            if (bbHomeAddress === null) {
                bbHomeAddress = address.toBlackBerryAddress();
                bbContact.homeAddress = bbHomeAddress;
            }
            else if (bbWorkAddress === null) {
                bbWorkAddress = address.toBlackBerryAddress();
                bbContact.workAddress = bbWorkAddress;
            }
        }
    }

    // copy first url found to BlackBerry 'webpage' field
    if (contact.urls && contact.urls instanceof Array) {
        
        // if this is an update, re-initialize web page
        if (update) {
            bbContact.webpage = "";
        }
        
        var url = null;
        for (var i=0; i<contact.urls.length; i+=1) {
            url = contact.urls[i];
            if (!url || !url.value) { 
                continue; 
            }
            if (bbContact.webpage === "") {
                bbContact.webpage = url.value;
                break;
            }
        }
    }
   
    // copy fields from first organization to the 
    // BlackBerry 'company' and 'jobTitle' fields
    if (contact.organizations && contact.organizations instanceof Array) {
        
        // if this is an update, re-initialize org attributes
        if (update) {
            bbContact.company = "";
        }
        
        var org = null;
        for (var i=0; i<contact.organizations.length; i+=1) {
            org = contact.organizations[i];
            if (!org) { 
                continue; 
            }
            if (bbContact.company === "") {
                bbContact.company = org.name || "";
                bbContact.jobTitle = org.title || "";
                break;
            }
        }
    }

    // categories
    if (contact.categories && contact.categories instanceof Array) {   
        bbContact.categories = [];
        var category = null;
        for (var i=0; i<contact.categories.length; i+=1) {
            category = contact.categories[i];
            if (typeof category == "string") {
                bbContact.categories.push(category);
            }
        }
    }    
    
    // save to device
    bbContact.save();

    // invoke native side to save photo
    // fail gracefully if photo URL is no good, but log the error
    if (contact.photos && contact.photos instanceof Array) {
        var photo = null;
        for (var i=0; i<contact.photos.length; i+=1) {
            photo = contact.photos[i];
            if (!photo || !photo.value) { 
                continue; 
            }
            PhoneGap.exec(
                    // success
                    function() {
                    },
                    // fail
                    function(e) {
                        console.log('Contact.setPicture failed:' + e);
                    },
                    "Contact", "setPicture", [bbContact.uid, photo.type, photo.value]
            );
            break;
        }
    }
    
    return bbContact.uid;
};

/**
 * Builds a BlackBerry filter expression using the contact fields and search 
 * filter provided.  The filter expression is used for contact searches.
 * @param {String[]} fields Array of Contact fields to search
 * @param {String} filter Filter, or search string
 * @return filter expression or null if fields is empty or filter is null or empty
 */
BlackBerryContacts.buildFilterExpression = function(fields, filter) {
    
    // ensure filter exists
    if (!filter || filter === "") {
        return null;
    }

    // BlackBerry API uses specific operators to build filter expressions for 
    // querying Contact lists.  The operators are ["!=","==","<",">","<=",">="].
    // Use of regex is also an option, and the only one we can use to simulate
    // an SQL '%LIKE%' clause.  
    //
    // Note: The BlackBerry regex implementation doesn't seem to support 
    // conventional regex switches that would enable a case insensitive search.  
    // It does not honor the (?i) switch (which causes Contact.find() to fail). 
    // We need case INsensitivity to match the W3C Contacts API spec.  
    // So the guys at RIM proposed this method: 
    //
    // original filter = "norm"
    // case insensitive filter = "[nN][oO][rR][mM]"
    //
    var ciFilter = "";
    for (var i = 0; i < filter.length; i++)
    {
        ciFilter = ciFilter + "[" + filter[i].toLowerCase() + filter[i].toUpperCase() + "]";
    }
    
    // match anything that contains our filter string
    filter = ".*" + ciFilter + ".*";
    
    // build a filter expression using all Contact fields provided
    var filterExpression = null;
    if (fields && fields instanceof Array) {
        var fe = null;
        for (var i in fields) {
            if (!fields[i]) {
                continue;
            }

            // retrieve the BlackBerry contact fields that map to the one specified
            var bbFields = navigator.service.BlackBerryContacts.fieldMappings[fields[i]];
            
            // BlackBerry doesn't support the field specified
            if (!bbFields) {
                continue;
            }

            // construct the filter expression using the BlackBerry fields
            for (var j in bbFields) {
                fe = new blackberry.find.FilterExpression(bbFields[j], "REGEX", filter);
                if (filterExpression === null) {
                    filterExpression = fe;
                } else {
                    // combine the filters
                    filterExpression = new blackberry.find.FilterExpression(filterExpression, "OR", fe);
                }
            }
        }
    }

    return filterExpression;
};

/**
 * Creates a BlackBerry Address object from this ContactAddress object.
 * @return {blackberry.pim.Address} a BlackBerry address object
 */
ContactAddress.prototype.toBlackBerryAddress = function() {
    
    var bbAddress = new blackberry.pim.Address();
    bbAddress.address1 = this.streetAddress || "";
    bbAddress.city = this.locality || "";
    bbAddress.stateProvince = this.region || "";
    bbAddress.zipPostal = this.postalCode || "";
    bbAddress.country = this.country || "";
    
    return bbAddress;
};

/**
 * Factory method. Creates a ContactAddress object from a BlackBerry Address object.
 * @param {blackberry.pim.Address} bbAddress a BlakcBerry Address object
 * @return {ContactAddress} a contact address object or null if the specified
 * address is null of not a blackberry.pim.Address object
 */
ContactAddress.fromBlackBerryAddress = function(bbAddress) {
    
    if (!bbAddress || bbAddress instanceof blackberry.pim.Address === false) {
        return null;
    }
    
    var address1 = bbAddress.address1 || "";
    var address2 = bbAddress.address2 || "";
    var streetAddress = address1 + ", " + address2;
    var locality = bbAddress.city || "";
    var region = bbAddress.stateProvince || "";
    var postalCode = bbAddress.zipPostal || "";
    var country = bbAddress.country || "";
    var formatted = streetAddress + ", " + locality + ", " + region + ", " + postalCode + ", " + country;

    return new ContactAddress(formatted, streetAddress, locality, region, postalCode, country);
};

/**
 * Factory method. Creates a Contact object from a BlackBerry Contact object, 
 * copying only the fields specified.
 * @param {blackberry.pim.Contact} bbContact BlackBerry Contact object
 * @param {String[]} fields array of contact fields that should be copied
 * @return {Contact} a contact object containing the specified fields 
 * or null if the specified contact is null
 */
BlackBerryContacts.createContact = function(bbContact, fields) {

    if (!bbContact) {
        return null;
    }
    
    // construct a new contact object
    // always copy the contact id and displayName fields
    var contact = new Contact(bbContact.uid, bbContact.user1);
    
    // nothing to do
    if (!fields) {
      return contact;
    }
    
    // add the fields specified
    for (var i in fields) {
        var field = fields[i];

        if (!field) {
            continue;
        }
        
        // name
        if (field.indexOf('name') === 0) {
            var formattedName = bbContact.title + ' ' + bbContact.firstName + ' ' + bbContact.lastName;
            contact.name = new ContactName(formattedName, bbContact.lastName, bbContact.firstName, null, bbContact.title, null);
        } 
        // phone numbers        
        else if (field.indexOf('phoneNumbers') === 0) {
            var phoneNumbers = [];
            if (bbContact.homePhone) {
                phoneNumbers.push(new ContactField('home', bbContact.homePhone));
            }
            if (bbContact.homePhone2) {
                phoneNumbers.push(new ContactField('home', bbContact.homePhone2));
            }
            if (bbContact.workPhone) {
                phoneNumbers.push(new ContactField('work', bbContact.workPhone));
            }
            if (bbContact.workPhone2) {
                phoneNumbers.push(new ContactField('work', bbContact.workPhone2));
            }
            if (bbContact.mobilePhone) {
                phoneNumbers.push(new ContactField('mobile', bbContact.mobilePhone));
            }
            if (bbContact.faxPhone) {
                phoneNumbers.push(new ContactField('fax', bbContact.faxPhone));
            }
            if (bbContact.pagerPhone) {
                phoneNumbers.push(new ContactField('pager', bbContact.pagerPhone));
            }
            if (bbContact.otherPhone) {
                phoneNumbers.push(new ContactField('other', bbContact.otherPhone));
            }
            contact.phoneNumbers = phoneNumbers;
        }
        // emails
        else if (field.indexOf('emails') === 0) {
            var emails = [];
            if (bbContact.email1) {
                emails.push(new ContactField(null, bbContact.email1, null));
            }
            if (bbContact.email2) { 
                emails.push(new ContactField(null, bbContact.email2, null));
            }
            if (bbContact.email3) { 
                emails.push(new ContactField(null, bbContact.email3, null));
            }
            contact.emails = emails;
        }
        // addresses
        else if (field.indexOf('addresses') === 0) {
            var addresses = [];
            if (bbContact.homeAddress) {
                addresses.push(ContactAddress.fromBlackBerryAddress(bbContact.homeAddress));
            }
            if (bbContact.workAddress) {
                addresses.push(ContactAddress.fromBlackBerryAddress(bbContact.workAddress));
            }
            contact.addresses = addresses;
        }
        // birthday
        else if (field.indexOf('birthday') === 0) {
            contact.birthday = bbContact.birthday;
        }
        // note
        else if (field.indexOf('note') === 0) {
            contact.note = bbContact.note;
        }
        // organizations
        else if (field.indexOf('organizations') === 0) {
            var organizations = [];
            if (bbContact.company || bbContact.jobTitle) {
                organizations.push(
                    new ContactOrganization(bbContact.company, null, bbContact.jobTitle));
            }
            contact.organizations = organizations;
        }
        // categories
        else if (field.indexOf('categories') === 0) {
            contact.categories = bbContact.categories; 
        }
        // urls
        else if (field.indexOf('urls') === 0) {
            var urls = [];
            if (bbContact.webpage) {
                urls.push(new ContactField(null, bbContact.webpage));
            }
            contact.urls = urls;
        }
        // photos
        else if (field.indexOf('photos') === 0) {
            var photos = [];
            // The BlackBerry Contact object will have a picture attribute
            // with Base64 encoded image
            if (bbContact.picture) {
                photos.push(new ContactField('base64', bbContact.picture));
            }
            contact.photos = photos;
        }
    }

    return contact;
};

PhoneGap.addConstructor(function() {
    if(typeof navigator.service === "undefined") navigator.service = new Object();
    if(typeof navigator.service.BlackBerryContacts === "undefined") navigator.service.BlackBerryContacts = new BlackBerryContacts();
});

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * This represents the mobile device, and provides properties for inspecting the model, version, UUID of the
 * phone, etc.
 * @constructor
 */
function Device() {
  this.platform = phonegap.device.platform;
  this.version  = blackberry.system.softwareVersion;
  this.name     = blackberry.system.model;
  this.uuid     = phonegap.device.uuid;
  this.phonegap = phonegap.device.phonegap;
};

PhoneGap.addConstructor(function() {
  navigator.device = window.device = new Device();
  PhoneGap.onPhoneGapInfoReady.fire();
});

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * These classes provides generic read and write access to the mobile device file system.
 * They are not used to read files from a server.
 */

/**
 * Contains properties that describe a file.
 */
function FileProperties(filePath) {
    this.filePath = filePath;
    this.size = 0;
    this.lastModifiedDate = null;
};

/**
 * FileError
 */
function FileError() {
    this.code = null;
};

// File error codes
// Found in DOMException
FileError.NOT_FOUND_ERR = 1;
FileError.SECURITY_ERR = 2;
FileError.ABORT_ERR = 3;

// Added by File API specification
FileError.NOT_READABLE_ERR = 4;
FileError.ENCODING_ERR = 5;
FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
FileError.INVALID_STATE_ERR = 7;
FileError.SYNTAX_ERR = 8;
FileError.INVALID_MODIFICATION_ERR = 9;
FileError.QUOTA_EXCEEDED_ERR = 10;
FileError.TYPE_MISMATCH_ERR = 11;
FileError.PATH_EXISTS_ERR = 12;

//-----------------------------------------------------------------------------
//File manager
//-----------------------------------------------------------------------------

/**
 * This class provides read and write access to mobile device file system in 
 * support of FileReader and FileWriter APIs based on 
 * http://www.w3.org/TR/2010/WD-FileAPI-20101026
 * and
 * <writer url>
 */
function FileMgr() {
};

/**
 * Returns the root file system paths.
 * 
 * @return {String[]} array of root file system paths
 */
FileMgr.prototype.getRootPaths = function() {
    return blackberry.io.dir.getRootDirs();
};

/**
 * Returns the available memory in bytes for the root file system of the specified file path.
 * 
 * @param filePath          A file system path
 */
FileMgr.prototype.getFreeDiskSpace = function(filePath) {
    return blackberry.io.dir.getFreeSpaceForRoot(filePath);
};

/**
 * Reads a file from the device and encodes the contents using the specified 
 * encoding. 
 * 
 * @param fileName          The full path of the file to read
 * @param encoding          The encoding to use to encode the file's content
 * @param successCallback   Callback invoked with file contents
 * @param errorCallback     Callback invoked on error
 */
FileMgr.prototype.readAsText = function(fileName, encoding, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "readAsText", [fileName, encoding]);
};

/**
 * Reads a file from the device and encodes the contents using BASE64 encoding.  
 * 
 * @param fileName          The full path of the file to read.
 * @param successCallback   Callback invoked with file contents
 * @param errorCallback     Callback invoked on error
 */
FileMgr.prototype.readAsDataURL = function(fileName, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "readAsDataURL", [fileName]);
};

/**
 * Writes data to the specified file.
 * 
 * @param fileName          The full path of the file to write
 * @param data              The data to be written
 * @param position          The position in the file to begin writing
 * @param successCallback   Callback invoked after successful write operation
 * @param errorCallback     Callback invoked on error
 */
FileMgr.prototype.write = function(fileName, data, position, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "write", [fileName, data, position]);
};

/**
 * Tests whether file exists.  Will return false if the path specifies a directory.
 * 
 * @param fullPath             The full path of the file 
 */
FileMgr.prototype.testFileExists = function(fullPath) {
    return blackberry.io.file.exists(fullPath);
};

/**
 * Tests whether directory exists.  Will return false if the path specifies a file.
 * 
 * @param fullPath             The full path of the directory
 */
FileMgr.prototype.testDirectoryExists = function(fullPath) {
    return blackberry.io.dir.exists(fullPath);
};

/**
 * Gets the properties of a file.  Throws an exception if fileName is a directory.
 * 
 * @param fileName          The full path of the file 
 */
FileMgr.prototype.getFileProperties = function(fileName) {    
    var fileProperties = new FileProperties(fileName);
    // attempt to get file properties
    if (blackberry.io.file.exists(fileName)) {
        var props = blackberry.io.file.getFileProperties(fileName);
        fileProperties.size = props.size;
        fileProperties.lastModifiedDate = props.dateModified;
    }
    // fileName is a directory
    else if (blackberry.io.dir.exists(fileName)) {
        throw FileError.TYPE_MISMATCH_ERR;
    }
    return fileProperties;
};

/**
 * Changes the length of the specified file.  Data beyond new length is discarded.  
 * 
 * @param fileName          The full path of the file to truncate
 * @param size              The size to which the length of the file is to be adjusted
 * @param successCallback   Callback invoked after successful write operation
 * @param errorCallback     Callback invoked on error
 */
FileMgr.prototype.truncate = function(fileName, size, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "truncate", [fileName, size]);
};

/**
 * Removes a file from the file system.
 * 
 * @param fileName          The full path of the file to be deleted
 */
FileMgr.prototype.deleteFile = function(fileName) {
    // delete file, if it exists
    if (blackberry.io.file.exists(fileName)) {
        blackberry.io.file.deleteFile(fileName);
    }
    // fileName is a directory
    else if (blackberry.io.dir.exists(fileName)) {
        throw FileError.TYPE_MISMATCH_ERR;
    }
    // fileName not found 
    else {
        throw FileError.NOT_FOUND_ERR;
    }
};

/**
 * Creates a directory on device storage.
 * 
 * @param dirName           The full path of the directory to be created
 */
FileMgr.prototype.createDirectory = function(dirName) {
    if (!blackberry.io.dir.exists(dirName)) {
        // createNewDir API requires trailing slash
        if (dirName.substr(-1) !== "/") {
            dirName += "/";
        }
        blackberry.io.dir.createNewDir(dirName);
    }
    // directory already exists
    else {
        throw FileError.PATH_EXISTS_ERR;
    }
};

/**
 * Deletes the specified directory from device storage.
 * 
 * @param dirName           The full path of the directory to be deleted
 */
FileMgr.prototype.deleteDirectory = function(dirName) {
    blackberry.io.dir.deleteDirectory(dirName);
};

PhoneGap.addConstructor(function() {
    if (typeof navigator.fileMgr == "undefined") navigator.fileMgr = new FileMgr();
});

//-----------------------------------------------------------------------------
//File Reader
//-----------------------------------------------------------------------------

/**
 * This class reads the mobile device file system.
 */
function FileReader() {
    this.fileName = "";

    this.readyState = 0;

    // File data
    this.result = null;

    // Error
    this.error = null;

    // Event handlers
    this.onloadstart = null;    // When the read starts.
    this.onprogress = null;     // While reading (and decoding) file or fileBlob data, and reporting partial file data (progess.loaded/progress.total)
    this.onload = null;         // When the read has successfully completed.
    this.onerror = null;        // When the read has failed (see errors).
    this.onloadend = null;      // When the request has completed (either in success or failure).
    this.onabort = null;        // When the read has been aborted. For instance, by invoking the abort() method.
};

//States
FileReader.EMPTY = 0;
FileReader.LOADING = 1;
FileReader.DONE = 2;

/**
 * Abort read file operation.
 */
FileReader.prototype.abort = function() {
    var event;
    
    // reset everything
    this.readyState = FileReader.DONE;
    this.result = null;
    
    // set error
    var error = new FileError();
    error.code = error.ABORT_ERR;
    this.error = error;

    // abort procedure
    if (typeof this.onerror == "function") {
        event = {"type":"error", "target":this};
        this.onerror(event);
    }
    if (typeof this.onabort == "function") {
        event = {"type":"abort", "target":this};
        this.onabort(event);
    }
    if (typeof this.onloadend == "function") {
        event = {"type":"loadend", "target":this};
        this.onloadend(event);
    }
};

/**
 * Reads and encodes text file.
 *
 * @param file          The name of the file
 * @param encoding      [Optional] (see http://www.iana.org/assignments/character-sets)
 */
FileReader.prototype.readAsText = function(file, encoding) {
    var event;
    
    // Use UTF-8 as default encoding
    var enc = encoding ? encoding : "UTF-8";
    
    // start
    this.readyState = FileReader.LOADING;
    if (typeof this.onloadstart == "function") {
        event = {"type":"loadstart", "target":this};
        this.onloadstart(event);
    }

    // read and encode file
    this.fileName = file;
    var me = this;
    navigator.fileMgr.readAsText(file, enc, 

        // success callback
        function(result) {
            // If DONE (canceled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // success procedure
            me.result = result;
            if (typeof me.onload == "function") {
                event = {"type":"load", "target":me};
                me.onload(event);
            }
            me.readyState = FileReader.DONE;
            if (typeof me.onloadend == "function") {
                event = {"type":"loadend", "target":me};
                me.onloadend(event);
            }
        },

        // error callback
        function(error) {
            // If DONE (canceled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // capture error
            var err = new FileError();
            err.code = error;
            me.error = err;
            
            // error procedure
            me.result = null;
            if (typeof me.onerror == "function") {
                event = {"type":"error", "target":me};
                me.onerror(event);
            }
            me.readyState = FileReader.DONE;
            if (typeof me.onloadend == "function") {
                event = {"type":"loadend", "target":me};
                me.onloadend(event);
            }
        }
    );
};

/**
 * Read file and return data as a base64 encoded data url.
 * A data url is of the form:
 *      data:[<mediatype>][;base64],<data>
 *
 * @param file          The name of the file
 */
FileReader.prototype.readAsDataURL = function(file) {
    var event;
    
    // start
    this.readyState = FileReader.LOADING;
    if (typeof this.onloadstart == "function") {
        event = {"type":"loadstart", "target":this};
        this.onloadstart(event);
    }
    
    // read and encode file
    this.fileName = file;
    var me = this;
    navigator.fileMgr.readAsDataURL(file, 

        // success callback
        function(result) {
            // If DONE (canceled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // success procedure
            me.result = result;
            if (typeof me.onload == "function") {
                event = {"type":"load", "target":me};
                me.onload(event);
            }
            me.readyState = FileReader.DONE;
            if (typeof me.onloadend == "function") {
                event = {"type":"loadend", "target":me};
                me.onloadend(event);
            }
        },

        // error callback
        function(error) {
            // If DONE (canceled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // capture error
            var err = new FileError();
            err.code = error;
            me.error = err;
            
            // error procedure
            me.result = null;
            if (typeof me.onerror == "function") {
                event = {"type":"error", "target":me};
                me.onerror(event);
            }
            me.readyState = FileReader.DONE;
            if (typeof me.onloadend == "function") {
                event = {"type":"loadend", "target":me};
                me.onloadend(event);
            }
        }
    );
};

//-----------------------------------------------------------------------------
//File Writer
//-----------------------------------------------------------------------------

/**
* This class writes to the mobile device file system.
*
* @param filePath       The full path to the file to be written to
* @param append         If true, then data will be written to the end of the file rather than the beginning 
*/
function FileWriter(filePath, append) {
    this.fileName = filePath;
    this.length = 0;

    // get the file properties
    var fp = navigator.fileMgr.getFileProperties(filePath);
    this.length = fp.size;
    
    // default is to write at the beginning of the file
    this.position = (append !== true) ? 0 : this.length;
    
    this.readyState = 0; // EMPTY
    
    // Error
    this.error = null;

    // Event handlers
    this.onwritestart = null;   // When writing starts
    this.onprogress = null;     // While writing the file, and reporting partial file data
    this.onwrite = null;        // When the write has successfully completed.
    this.onwriteend = null;     // When the request has completed (either in success or failure).
    this.onabort = null;        // When the write has been aborted. For instance, by invoking the abort() method.
    this.onerror = null;        // When the write has failed (see errors).
};

//States
FileWriter.INIT = 0;
FileWriter.WRITING = 1;
FileWriter.DONE = 2;

/**
 * Abort writing file.
 */
FileWriter.prototype.abort = function() {
    var event;
    // check for invalid state 
    if (this.readyState === FileWriter.DONE || this.readyState === FileWriter.INIT) {
        throw FileError.INVALID_STATE_ERR;
    }
    
    // set error
    var error = new FileError();
    error.code = error.ABORT_ERR;
    this.error = error;

    // dispatch progress events
    if (typeof this.onerror == "function") {
        event = {"type":"error", "target":this};
        this.onerror(event);
    }
    if (typeof this.onabort == "function") {
        event = {"type":"abort", "target":this};
        this.onabort(event);
    }

    // set state
    this.readyState = FileWriter.DONE;
    
    // done
    if (typeof this.writeend == "function") {
        event = {"type":"writeend", "target":this};
        this.writeend(event);
    }
};

/**
 * Sets the file position at which the next write will occur.
 * 
 * @param offset    Absolute byte offset into the file
 */
FileWriter.prototype.seek = function(offset) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw FileError.INVALID_STATE_ERR;
    }

    if (!offset) {
        return;
    }
    
    // offset is bigger than file size, set to length of file
    if (offset > this.length) { 
        this.position = this.length;
    }
    // seek back from end of file
    else if (offset < 0) { 
        this.position = Math.max(offset + this.length, 0);
    } 
    // offset in the middle of file
    else {
        this.position = offset;
    }
};

/**
 * Truncates the file to the specified size.
 * 
 * @param size      The size to which the file length is to be adjusted
 */
FileWriter.prototype.truncate = function(size) {
    var event;
    
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw FileError.INVALID_STATE_ERR;
    }
    
    // start
    this.readyState = FileWriter.WRITING;
    if (typeof this.onwritestart == "function") {
        event = {"type":"writestart", "target":this};
        this.onwritestart(event);
    }

    // truncate file
    var me = this;
    navigator.fileMgr.truncate(this.fileName, size, 
        // Success callback receives the new file size
        function(result) {
            // If DONE (canceled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // new file size is returned
            me.length = result;
            // position is lesser of old position or new file size
            me.position = Math.min(me.position, result);

            // success procedure
            if (typeof me.onwrite == "function") {
                event = {"type":"write", "target":me};
                me.onwrite(event);
            }
            me.readyState = FileWriter.DONE;
            if (typeof me.onwriteend == "function") {
                event = {"type":"writeend", "target":me};
                me.onwriteend(event);
            }
        },

        // Error callback
        function(error) {
            // If DONE (canceled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // Save error
            var err = new FileError();
            err.code = error;
            me.error = err;

            // error procedure
            if (typeof me.onerror == "function") {
                event = {"type":"error", "target":me};
                me.onerror(event);
            }
            me.readyState = FileWriter.DONE;
            if (typeof me.onwriteend == "function") {
                event = {"type":"writeend", "target":me};
                me.onwriteend(event);
            }
        }            
    );
};

/**
 * Writes the contents of a file to the device.
 * 
 * @param data      contents to be written
 */
FileWriter.prototype.write = function(data) {
    var event;
    
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw FileError.INVALID_STATE_ERR;
    }

    // WRITING state
    this.readyState = FileWriter.WRITING;
    if (typeof this.onwritestart == "function") {
        event = {"type":"writestart", "target":this};
        this.onwritestart(event);
    }

    // Write file
    var me = this;
    navigator.fileMgr.write(this.fileName, data, this.position,

        // Success callback receives bytes written
        function(result) {
            // If DONE (canceled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // new length is maximum of old length, or position plus bytes written
            me.length = Math.max(me.length, me.position + result);
            // position always increases by bytes written because file would be extended
            me.position += result;

            // success procedure
            if (typeof me.onwrite == "function") {
                event = {"type":"write", "target":me};
                me.onwrite(event);
            }
            me.readyState = FileWriter.DONE;
            if (typeof me.onwriteend == "function") {
                event = {"type":"writeend", "target":me};
                me.onwriteend(event);
            }
        },

        // Error callback
        function(error) {
            // If DONE (canceled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // Save error
            var err = new FileError();
            err.code = error;
            me.error = err;

            // error procedure
            if (typeof me.onerror == "function") {
                event = {"type":"error", "target":me};
                me.onerror(event);
            }
            me.readyState = FileWriter.DONE;
            if (typeof me.onwriteend == "function") {
                event = {"type":"writeend", "target":me};
                me.onwriteend(event);
            }
        }
    );
};

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *  
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * FileTransfer transfers files to a remote server.
 */
function FileTransfer() {};

/**
 * FileUploadResult
 */
function FileUploadResult() {
    this.bytesSent = 0;
    this.responseCode = null;
    this.response = null;
};

/**
 * FileTransferError
 */
function FileTransferError() {
    this.code = null;
};

FileTransferError.FILE_NOT_FOUND_ERR = 1;
FileTransferError.INVALID_URL_ERR = 2;
FileTransferError.CONNECTION_ERR = 3;

/**
* Given an absolute file path, uploads a file on the device to a remote server 
* using a multipart HTTP request.
* @param filePath {String}           Full path of the file on the device
* @param server {String}             URL of the server to receive the file
* @param successCallback (Function}  Callback to be invoked when upload has completed
* @param errorCallback {Function}    Callback to be invoked upon error
* @param options {FileUploadOptions} Optional parameters such as file name and mimetype           
*/
FileTransfer.prototype.upload = function(filePath, server, successCallback, errorCallback, options) {

    // check for options
    var fileKey = null;
    var fileName = null;
    var mimeType = null;
    var params = null;
    if (options) {
        fileKey = options.fileKey;
        fileName = options.fileName;
        mimeType = options.mimeType;
        params = options.params;
    }
        
    // error callback
    var fail = function(error) {
        var err = new FileTransferError();
        err.code = error;
        if (typeof errorCallback === "function") {
            errorCallback(err);
        }
    };
    
    PhoneGap.exec(successCallback, fail, 'FileTransfer', 'upload', [filePath, server, fileKey, fileName, mimeType, params]);
};

/**
 * Options to customize the HTTP request used to upload files.
 * @param fileKey {String}   Name of file request parameter.
 * @param fileName {String}  Filename to be used by the server. Defaults to image.jpg.
 * @param mimeType {String}  Mimetype of the uploaded file. Defaults to image/jpeg.
 * @param params {Object}    Object with key: value params to send to the server.
 */
function FileUploadOptions(fileKey, fileName, mimeType, params) {
    this.fileKey = fileKey || null;
    this.fileName = fileName || null;
    this.mimeType = mimeType || null;
    this.params = params || null;
};

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * This class provides access to device GPS data.
 * @constructor
 */
function Geolocation() {

    // The last known GPS position.
    this.lastPosition = null;

    // Geolocation listeners
    this.listeners = {};
};

/**
 * Position error object
 *
 * @param code
 * @param message
 */
function PositionError(code, message) {
    this.code = code;
    this.message = message;
};

PositionError.PERMISSION_DENIED = 1;
PositionError.POSITION_UNAVAILABLE = 2;
PositionError.TIMEOUT = 3;

/**
 * Asynchronously aquires the current position.
 *
 * @param {Function} successCallback    The function to call when the position data is available
 * @param {Function} errorCallback      The function to call when there is an error getting the heading position. (OPTIONAL)
 * @param {PositionOptions} options     The options for getting the position data. (OPTIONAL)
 */
Geolocation.prototype.getCurrentPosition = function(successCallback, errorCallback, options) {

    var id = "global";
    if (navigator._geo.listeners[id]) {
        console.log("Geolocation Error: Still waiting for previous getCurrentPosition() request.");
        try {
            errorCallback(new PositionError(PositionError.TIMEOUT, "Geolocation Error: Still waiting for previous getCurrentPosition() request."));
        } catch (e) {
        }
        return;
    }
    
    // default maximumAge value should be 0, and set if positive 
    var maximumAge = 0;

    // default timeout value should be infinity, but that's a really long time
    var timeout = 3600000; 

    var enableHighAccuracy = false;
    if (options) {
        if (options.maximumAge && (options.maximumAge > 0)) {
            maximumAge = options.maximumAge;
        }
        if (options.enableHighAccuracy) {
            enableHighAccuracy = options.enableHighAccuracy;
        }
        if (options.timeout) {
            timeout = (options.timeout < 0) ? 0 : options.timeout;
        }
    }
    navigator._geo.listeners[id] = {"success" : successCallback, "fail" : errorCallback };
    PhoneGap.exec(null, errorCallback, "Geolocation", "getCurrentPosition", [id, maximumAge, timeout, enableHighAccuracy]);
}

/**
 * Asynchronously watches the geolocation for changes to geolocation.  When a change occurs,
 * the successCallback is called with the new location.
 *
 * @param {Function} successCallback    The function to call each time the location data is available
 * @param {Function} errorCallback      The function to call when there is an error getting the location data. (OPTIONAL)
 * @param {PositionOptions} options     The options for getting the location data such as frequency. (OPTIONAL)
 * @return String                       The watch id that must be passed to #clearWatch to stop watching.
 */
Geolocation.prototype.watchPosition = function(successCallback, errorCallback, options) {

    // default maximumAge value should be 0, and set if positive 
    var maximumAge = 0;

    // DO NOT set timeout to a large value for watchPosition in BlackBerry.  
    // The interval used for updates is half the timeout value, so a large 
    // timeout value will mean a long wait for the first location.
    var timeout = 10000; 

    var enableHighAccuracy = false;
    if (options) {
        if (options.maximumAge && (options.maximumAge > 0)) {
            maximumAge = options.maximumAge;
        }
        if (options.enableHighAccuracy) {
            enableHighAccuracy = options.enableHighAccuracy;
        }
        if (options.timeout) {
            timeout = (options.timeout < 0) ? 0 : options.timeout;
        }
    }
    var id = PhoneGap.createUUID();
    navigator._geo.listeners[id] = {"success" : successCallback, "fail" : errorCallback };
    PhoneGap.exec(null, errorCallback, "Geolocation", "watchPosition", [id, maximumAge, timeout, enableHighAccuracy]);
    return id;
};

/*
 * Native callback when watch position has a new position.
 */
Geolocation.prototype.success = function(id, result) {

	var p = result.message;
    var coords = new Coordinates(p.latitude, p.longitude, p.altitude, p.accuracy, p.heading, p.speed, p.alt_accuracy);
    var loc = new Position(coords, p.timestamp);
	try {
        navigator._geo.lastPosition = loc;
        navigator._geo.listeners[id].success(loc);
    }
    catch (e) {
        console.log("Geolocation Error: Error calling success callback function.");
    }

    if (id == "global") {
        delete navigator._geo.listeners["global"];
    }
};

/**
 * Native callback when watch position has an error.
 *
 * @param {String} id       The ID of the watch
 * @param {Object} result   The result containing status and message
 */
Geolocation.prototype.fail = function(id, result) {
    var code = result.status;
    var msg = result.message;
	try {
        navigator._geo.listeners[id].fail(new PositionError(code, msg));
    }
    catch (e) {
        console.log("Geolocation Error: Error calling error callback function.");
    }

    if (id == "global") {
        delete navigator._geo.listeners["global"];
    }
};

/**
 * Clears the specified position watch.
 *
 * @param {String} id       The ID of the watch returned from #watchPosition
 */
Geolocation.prototype.clearWatch = function(id) {
    PhoneGap.exec(null, null, "Geolocation", "stop", [id]);
    delete navigator._geo.listeners[id];
};

/**
 * Force the PhoneGap geolocation to be used instead of built-in.
 */
Geolocation.usingPhoneGap = false;
Geolocation.usePhoneGap = function() {
    if (Geolocation.usingPhoneGap) {
        return;
    }
    Geolocation.usingPhoneGap = true;

    // Set built-in geolocation methods to our own implementations
    // (Cannot replace entire geolocation, but can replace individual methods)
    navigator.geolocation.getCurrentPosition = navigator._geo.getCurrentPosition;
    navigator.geolocation.watchPosition = navigator._geo.watchPosition;
    navigator.geolocation.clearWatch = navigator._geo.clearWatch;
    navigator.geolocation.success = navigator._geo.success;
    navigator.geolocation.fail = navigator._geo.fail;
};

PhoneGap.addConstructor(function() {
    navigator._geo = new Geolocation();

    // if no native geolocation object, use PhoneGap geolocation
    if (typeof navigator.geolocation == 'undefined') {
        navigator.geolocation = navigator._geo;
        Geolocation.usingPhoneGap = true;
    }
});

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * Network status.
 */
NetworkStatus = {
  NOT_REACHABLE: 0,
  REACHABLE_VIA_CARRIER_DATA_NETWORK: 1,
  REACHABLE_VIA_WIFI_NETWORK: 2
};

/**
 * This class provides access to device Network data (reachability).
 * @constructor
 */
function Network() {
    /**
     * The last known Network status.
	 * { hostName: string, ipAddress: string, 
		remoteHostStatus: int(0/1/2), internetConnectionStatus: int(0/1/2), localWiFiConnectionStatus: int (0/2) }
     */
	this.lastReachability = null;
};

/**
 * Determine if a URI is reachable over the network.

 * @param {Object} uri
 * @param {Function} callback
 * @param {Object} options  (isIpAddress:boolean)
 */
Network.prototype.isReachable = function(uri, callback, options) {
    var isIpAddress = false;
    if (options && options.isIpAddress) {
        isIpAddress = options.isIpAddress;
    }
    PhoneGap.exec(callback, null, 'Network Status', 'isReachable', [uri, isIpAddress]);
};

PhoneGap.addConstructor(function() {
	if (typeof navigator.network == "undefined") navigator.network = new Network();
});

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * This class provides access to notifications on the device.
 */
function Notification() {
}

/**
 * Open a native alert dialog, with a customizable title and button text.
 * @param {String}   message          Message to print in the body of the alert
 * @param {Function} completeCallback The callback that is invoked when user clicks a button.
 * @param {String}   title            Title of the alert dialog (default: 'Alert')
 * @param {String}   buttonLabel      Label of the close button (default: 'OK')
 */
Notification.prototype.alert = function(message, completeCallback, title, buttonLabel) {
    var _title = (title || "Alert");
    var _buttonLabel = (buttonLabel || "OK");
    PhoneGap.exec(completeCallback, null, 'Notification', 'alert', [message, _title, _buttonLabel]);
};

/**
 * Open a custom confirmation dialog, with a customizable title and button text.
 * @param {String}  message         Message to print in the body of the dialog
 * @param {Function}resultCallback  The callback that is invoked when a user clicks a button.
 * @param {String}  title           Title of the alert dialog (default: 'Confirm')
 * @param {String}  buttonLabels    Comma separated list of the button labels (default: 'OK,Cancel')
 */
Notification.prototype.confirm = function(message, resultCallback, title, buttonLabels) {
    var _title = (title || "Confirm");
    var _buttonLabels = (buttonLabels || "OK,Cancel");
    return PhoneGap.exec(resultCallback, null, 'Notification', 'confirm', [message, _title, _buttonLabels]);
};

/**
 * Causes the device to vibrate.
 * @param {Integer} mills The number of milliseconds to vibrate for.
 */
Notification.prototype.vibrate = function(mills) {
    PhoneGap.exec(null, null, 'Notification', 'vibrate', [mills]);
};

/**
 * Causes the device to beep.
 * @param {Integer} count The number of beeps.
 */
Notification.prototype.beep = function(count) {
    PhoneGap.exec(null, null, 'Notification', 'beep', [count]);
};

PhoneGap.addConstructor(function() {
    if (typeof navigator.notification == "undefined") navigator.notification = new Notification();
});

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 * 
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010, IBM Corporation
 */

/**
 * This class contains position information.
 * @param {Object} lat
 * @param {Object} lng
 * @param {Object} acc
 * @param {Object} alt
 * @param {Object} altacc
 * @param {Object} head
 * @param {Object} vel
 * @constructor
 */
function Position(coords, timestamp) {
	this.coords = coords;
    this.timestamp = timestamp;
}

function Coordinates(lat, lng, alt, acc, head, vel, altacc) {
	/**
	 * The latitude of the position.
	 */
	this.latitude = lat;
	/**
	 * The longitude of the position,
	 */
	this.longitude = lng;
	/**
	 * The accuracy of the position.
	 */
	this.accuracy = acc;
	/**
	 * The altitude of the position.
	 */
	this.altitude = alt;
	/**
	 * The direction the device is moving at the position.
	 */
	this.heading = head;
	/**
	 * The velocity with which the device is moving at the position.
	 */
	this.speed = vel;
	/**
	 * The altitude accuracy of the position.
	 */
	this.altitudeAccuracy = (altacc != 'undefined') ? altacc : null; 
}
