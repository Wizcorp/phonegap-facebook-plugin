/**
 * Jasmine Based test suites
 *
 * Several of facebookConnectPlugin APIs cannot be automatically tested, because 
 * they depend on user interaction in order to call success or fail
 * handlers. For most of them, there is a basic test that assert the presence of 
 * the API.
 *
 * There are some cases that test automation can be applied, i.e in "getLoginStatus", 
 * "logEvent" and "logPurchase" methods. For those cases, there is some level 
 * of automatic test coverage.
 */
exports.defineAutoTests = function () {
    'use strict';
    
    describe('facebookConnectPlugin', function () {
    	it('should be defined', function () {
            expect(facebookConnectPlugin).toBeDefined();
        });        
        
        describe('getLoginStatus', function () {
            it('should be defined', function () {
                expect(facebookConnectPlugin.getLoginStatus).toBeDefined();
            });
            
            it('should be a function', function () {
                expect(typeof facebookConnectPlugin.getLoginStatus).toEqual('function');
            });
            
            it('should call success callback with status argument defined',function(done){
                function onSuccess(data){
                    expect(data.status).toBeDefined();
                    done();
                }
                
                function onError(error){
                    expect(true).toEqual(false); // to make it fail
                    done();
                }
                
                facebookConnectPlugin.getLoginStatus(onSuccess,onError);
            });
        });
        
        describe('showDialog', function () {
            it('should be defined', function () {
                expect(facebookConnectPlugin.showDialog).toBeDefined();
            });
            
            it('should be a function', function () {
                expect(typeof facebookConnectPlugin.showDialog).toEqual('function');
            });
        });
        
        describe('login', function () {
            it('should be defined', function () {
                expect(facebookConnectPlugin.login).toBeDefined();
            });
            
            it('should be a function', function () {
                expect(typeof facebookConnectPlugin.login).toEqual('function');
            });
        });
        
        describe('logEvent', function () {
            it('should be defined', function () {
                expect(facebookConnectPlugin.logEvent).toBeDefined();
            });
            
            it('should be a function', function () {
                expect(typeof facebookConnectPlugin.logEvent).toEqual('function');
            });
            
            it('should succeed when called with valid arguments', function (done) {
                function onSuccess(data){
                    expect(data).toBeDefined();
                    done();
                }
                
                function onError(error){
                    expect(true).toEqual(false); // to make it fail
                    done();
                }
                
                facebookConnectPlugin.logEvent('test-event',{},0,onSuccess,onError);
            });
        });
    
        describe('logPurchase', function () {
            it('should be defined', function () {
                expect(facebookConnectPlugin.logPurchase).toBeDefined();
            });
            
            it('should be a function', function () {
                expect(typeof facebookConnectPlugin.logPurchase).toEqual('function');
            });

            it('should succeed when called with valid currency code', function (done) {
                function onSuccess(data){
                    expect(data).toBeDefined();
                    done();
                }

                function onError(error){
                    expect(true).toEqual(false); // to make it fail
                    done();
                }

                facebookConnectPlugin.logPurchase(1,'ARS',onSuccess,onError);
            });

            it('should fail when called with invalid currency code', function (done) {
                function onSuccess(data){
                    expect(true).toEqual(false); // to make it fail
                    done();
                }

                function onError(error){
                    expect(error).toBeDefined();
                    done();
                }

                facebookConnectPlugin.logPurchase(1,'BITCOINS',onSuccess,onError);
            });
        });
        
        describe('getAccessToken', function () {
            it('should be defined', function () {
                expect(facebookConnectPlugin.getAccessToken).toBeDefined();
            });
            
            it('should be a function', function () {
                expect(typeof facebookConnectPlugin.getAccessToken).toEqual('function');
            });
            
            it('should always call success or error callback',function(done){
                function onSuccess(data){
                    expect(data).toBeDefined();
                    done();
                }
                
                function onError(error){
                    expect(error).toBeDefined();
                    done(error);
                }
                
                facebookConnectPlugin.getAccessToken(onSuccess,onError);
            });
        });
        
        describe('logout', function () {
            it('should be defined', function () {
                expect(facebookConnectPlugin.logout).toBeDefined();
            });
            
            it('should be a function', function () {
                expect(typeof facebookConnectPlugin.logout).toEqual('function');
            });
            
            it('should always call success or error callback', function (done) {
                function onSuccess(data){
                    expect(data).toBeDefined();
                    done();
                }

                function onError(error){
                    expect(error).toBeDefined();
                    done();
                }

                facebookConnectPlugin.logout(onSuccess,onError);
            });
        });
        
        describe('api', function () {
            it('should be defined', function () {
                expect(facebookConnectPlugin.api).toBeDefined();
            });
            
            it('should be a function', function () {
                expect(typeof facebookConnectPlugin.api).toEqual('function');
            });
        });
    });
};

/**
 * Manual tests suites
 *
 * Some actions buttons to execute facebookConnectPlugin methods
 */
exports.defineManualTests = function (contentEl, createActionButton) {
    'use strict';
    
    /** helper function to log a messages in the log widget */
    function logMessage(message, color) {
        var log = document.getElementById('info'),
            logLine = document.createElement('div');
        
        if (color) {
            logLine.style.color = color;
        }
        
        logLine.innerHTML = message;
        log.appendChild(logLine);
    }

    /** helper function to clear the log widget */
    function clearLog() {
        var log = document.getElementById('info');
        log.innerHTML = '';
    }
    
    /** helper class to log a non implemented event */
    function testNotImplemented(testName) {
        return function () {
            console.error(testName, 'test not implemented');
        };
    }
    
    /** function called on deviceready event */
    function init() {}
        
    /** object to hold properties and configs */
    var TestSuite = {};
    
    TestSuite.$markup = '' +
        '<fieldset>' +
            '<legend>Authentication</legend>' +
            
            '<h3>Login</h3>' +
            '<div id="buttonLogin"></div>' +
            'Expected result: should display Facebook Login widget' +
        
            '<h3>Get Access Token</h3>' +
            '<div id="buttonGetAccessToken"></div>' +
            'Expected result: should display access token if the user is already logged in, otherwise should log the error' +
        
            '<h3>Get Login Status</h3>' +
            '<div id="buttonGetLoginStatus"></div>' +
            'Expected result: should display login status' +
        
            '<h3>Logout</h3>' +
            '<div id="buttonLogout"></div>' +
            'Expected result: should logout from test app if the user is already logged in, otherwise should log the error' +
        '</fieldset>' +
        
        '<fieldset>' +
            '<legend>Publish</legend>' +
            
            '<h3>Post To Wall</h3>' +
            '<div id="buttonPostToWall"></div>' +
            'Expected result: should post to the user\'s feed if the user is already logged in, otherwise should log the error' +
        
            '<h3>Publish a Photo</h3>' +
            '<div id="buttonPublishPhoto"></div>' +
            'Expected result: should send photo to user\'s feed if the user is already logged in, otherwise should log the error' +
        '</fieldset>' +
        
        '<fieldset>' +
            '<legend>Event</legend>' +
            
            'Event Name: <input type="text" id="eventNameInput"><br>' +
        
            '<h3>Log Event</h3>' +
            '<div id="buttonLogEvent"></div>' +
            'Expected result: should log an event with the given Event Name' +
        '</fieldset>' +
        
        '<fieldset>' +
            '<legend>Purchase</legend>' +
            
            'Amount: <input type="number" id="amountInput"><br>' +
            'Currency Code: <input type="text" id="currencyCodeInput"><br>' +
        
            '<h3>Log Purchase</h3>' +
            '<div id="buttonLogPurchase"></div>' +
            'Expected result: should log a purchase with the given Amount and the given Currency Code' +
        '</fieldset>' +
        '';
        
    contentEl.innerHTML = '<div id="info"></div>' + TestSuite.$markup;
    
    TestSuite.getEventName = function () {
        return document.getElementById('eventNameInput').value;
    };
    
    TestSuite.getAmount = function () {
        return parseInt(document.getElementById('amountInput').value);
    };
    
    TestSuite.getCurrencyCode = function () {
        return document.getElementById('currencyCodeInput').value;
    };
    
    createActionButton('login', function () {
        clearLog();
        
        function onSuccess (userData) {
            console.log('login succeed, userData written in log');
            var message = 'User Info: ' + JSON.stringify(userData);
            logMessage(message,'green');
        }
        
        function onError (error) {
            console.error('login fail, error written in log');
            var message = 'login error: ' + JSON.stringify(error);
            logMessage(message,'red');
        }
        
        facebookConnectPlugin.login(['public_profile'],onSuccess,onError);
    }, 'buttonLogin');
    
    createActionButton('getAccessToken', function () {
        clearLog();
        
        function onSuccess(token){
            console.log('getAccessToken succeed, token written in log');
            var message = 'Access Token: ' + JSON.stringify(token);
            logMessage(message,'green');
        }
        
        function onError(error){
            console.error('getAccessToken fail, error written in log');
            var message = 'getAccessToken error: ' + JSON.stringify(error);
            logMessage(message,'red');
        }
        
        facebookConnectPlugin.getAccessToken(onSuccess,onError);
    }, 'buttonGetAccessToken');
    
    createActionButton('getLoginStatus', function () {
        clearLog();
        
        function onSuccess(status){
            console.log('getLoginStatus succeed, statua written in log');
            var message = "Login Status: " + JSON.stringify(status);
            logMessage(message,'green');
        }

        function onError(error){
            console.error('getLoginStatus fail, error written in log');
            var message = 'getLoginStatus error: ' + JSON.stringify(error);
            logMessage(message,'red');
        }
        
        facebookConnectPlugin.getLoginStatus(onSuccess,onError);
    }, 'buttonGetLoginStatus');
    
    createActionButton('logout', function () {
        clearLog();
        
        function onSuccess(data){
            console.log('logout succeed, data written in log');
            var message = "Logout data: " + JSON.stringify(data);
            logMessage(message,'green');
        }

        function onError(error){
            console.error('logout fail, error written in log');
            var message = 'logout error: ' + JSON.stringify(error);
            logMessage(message,'red');
        }
        
        facebookConnectPlugin.logout(onSuccess,onError);
    }, 'buttonLogout');
    
    createActionButton('showDialog', function () {
        clearLog();
        
        var options = { method:"feed" };
        
        function  onSuccess (result) {
            console.log('showDialog success, data written in log');
            var message = "Posted: " + JSON.stringify(result);
            logMessage(message,'green');
        }

        function  onError (error) {
            console.error('showDialog fail, error written in log');
            var message = 'showDialog error: ' + JSON.stringify(error);
            logMessage(message,'red');
        }

        facebookConnectPlugin.showDialog(options,onSuccess,onError);
    }, 'buttonPostToWall');
    
    createActionButton('publishPhoto', function () {
        clearLog();
        
        var options = {
            method: "feed",
            picture:'https://www.google.co.jp/logos/doodles/2014/doodle-4-google-2014-japan-winner-5109465267306496.2-hp.png',
            name:'Test Post',
            message:'First photo post',    
            caption: 'Testing using phonegap plugin',
            description: 'Posting photo using phonegap facebook plugin'
        };
        
        function  onSuccess (result) {
            console.log('showDialog success, data written in log');
            var message = 'Publish Photo: ' + JSON.stringify(result);
            logMessage(message,'green');
        }

        function  onError (error) {
            console.error('showDialog fail, error written in log');
            var message = 'showDialog error: ' + JSON.stringify(error);
            logMessage(message,'red');
        }
        
        facebookConnectPlugin.showDialog(options,onSuccess,onError);
    }, 'buttonPublishPhoto');
    
    createActionButton('logEvent', function () {
        clearLog();
        
        var eventName = TestSuite.getEventName();
        
        function onSuccess(data) {
            console.log('logEvent success, data written in console');
            var message = 'logEvent data: ' + JSON.stringify(data);
            logMessage(message,'green');
        }
        
        function onError (error) {
            console.error('logEvent fail, error written in console');
            var message = 'logEvent error: ' + JSON.stringify(error);
            logMessage(message,'red');
        }
        
        facebookConnectPlugin.logEvent(eventName,{},0,onSuccess,onError);  
    }, 'buttonLogEvent');
    
    createActionButton('logPurchase', function () {
        clearLog();
        
        var purchaseAmount = TestSuite.getAmount();
        var currencyCode = TestSuite.getCurrencyCode();
        
        function onSuccess(data) {
            console.log('logPurchase success, data written in console');
            var message = 'logPurchase data: ' + JSON.stringify(data);
            logMessage(message,'green');
        }
        
        function onError (error) {
            console.error('logPurchase fail, error written in console');
            var message = 'logPurchase error: ' + JSON.stringify(error);
            logMessage(message,'red');
        }
        
        facebookConnectPlugin.logPurchase(purchaseAmount,currencyCode,onSuccess,onError);  
    }, 'buttonLogPurchase');
    
    document.addEventListener('deviceready', init, false);
};