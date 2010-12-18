/*
* Titanium OAuth Client
*
* Copyright 2010, Social Vitamin, Inc.
* Licensed under the MIT
* Copyright (c) 2010 Social Vitamin, Inc.
*
* Permission is hereby granted, free of charge, to any person obtaining
* a copy of this software and associated documentation files (the
* "Software"), to deal in the Software without restriction, including
* without limitation the rights to use, copy, modify, merge, publish,
* distribute, sublicense, and/or sell copies of the Software, and to
* permit persons to whom the Software is furnished to do so, subject to
* the following conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
* LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
* OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
* WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

Ti.include('js/sha1.js');
Ti.include('js/oauth.js');

var TitaniumOAuth = function(ck, cs) {

	//Ti.App.Properties.setString('oauthToken', null);
	//Ti.App.Properties.setString('oauthTokenSecret', null);
	//Ti.App.Properties.setString('accessToken', null);
    //Ti.App.Properties.setString('accessTokenSecret', null);

	var that = this;
	var currentWin = Ti.UI.currentWindow;
	var oauthWin = null;
	var oauthToken = Ti.App.Properties.getString('oauthToken');
	var oauthTokenSecret = Ti.App.Properties.getString('oauthTokenSecret');
	var accessToken = Ti.App.Properties.getString('accessToken');
	var accessTokenSecret = Ti.App.Properties.getString('accessTokenSecret');
	
	var consumer = {
	    consumerKey:      ck,
	    consumerSecret:   cs,
	    serviceProvider: {
	        signatureMethod:     'HMAC-SHA1',
	        requestTokenURL:     'https://twitter.com/oauth/request_token',
	        userAuthorizationURL:'https://twitter.com/oauth/authorize',
	        accessTokenURL:      'https://twitter.com/oauth/access_token',
			oauthVersion:        '1.0'
	    }
	};
	
	var accessor = {
	    consumerSecret: consumer.consumerSecret,
	    tokenSecret: ''
	};
	
	this.setTokenSecret = function(secret){
		accessor.tokenSecret = secret;
	};
	
	this.setToken = function(token){
		oauthToken = token;
	};
	
	// Get Authorization PIN
	var getPIN = function(e)
	{
		if (e.source.html != 'undefined') {
			var dom = Ti.XML.parseString(e.source.html);
			var pin = dom.getElementById('oauth_pin');
			if (pin) {			
				that.accessToken(pin.text);
				if(oauthWin != null) {
					oauthWin.close();
					Ti.UI.createAlertDialog({
		                title: 'Success',
		                message: 'You have successfully logged in.'
		            }).show();
				}				
			}
		}
	};
	
	// Request Token
	this.requestToken = function(callback){
		 
		var message = {
		    method: 'GET',
		    action: consumer.serviceProvider.requestTokenURL,
		    parameters: [
		       ['oauth_signature_method', consumer.serviceProvider.signatureMethod],
		       ['oauth_consumer_key', consumer.consumerKey],
		       ['oauth_version', consumer.serviceProvider.oauthVersion]
		   ]
		};
		
		OAuth.setTimestampAndNonce(message);
		OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
		OAuth.SignatureMethod.sign(message, accessor);
		
		var finalUrl = OAuth.addToURL(message.action, message.parameters);
		
		var xhr = Titanium.Network.createHTTPClient();
		xhr.onload = function()
		{
			// Set Tokens
			that.setToken(this.responseText.match(/oauth_token=([^&]+)&/)[1]);
			that.setTokenSecret(this.responseText.match(/oauth_token_secret=([^&]+)&/)[1]);
			
			// Access Token Secret
			accessor.tokenSecret = accessTokenSecret;

			// Verify if we have an access token if we dont show auth webview
			if (accessToken == null && accessTokenSecret == null) {
				that.oauthWebView({
					url: consumer.serviceProvider.userAuthorizationURL + '?' + this.responseText + '&oauth_callback=oob'
				});
			} else {
				callback();
			}
			
		};
		xhr.onerror = function() {
			 Ti.UI.createAlertDialog({
                title: 'Error',
                message: 'Error getting request token.'
            }).show();
		};
		xhr.open('GET', finalUrl);
		xhr.send();
	
	};
	
	// Access Token
	this.accessToken = function(pin, callback){
		
	    var message = {
	        method: 'GET',
	        action: consumer.serviceProvider.accessTokenURL,
	        parameters: [
	           ['oauth_signature_method', consumer.serviceProvider.signatureMethod],
	           ['oauth_consumer_key', consumer.consumerKey],
	           ['oauth_version', '1.0'],
	           ['oauth_token', oauthToken],
	           ['oauth_token_secret', accessor.tokenSecret],
	           ['oauth_verifier', pin]
	       ]
	    };
	    
	    OAuth.setTimestampAndNonce(message);
	    OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
	    OAuth.SignatureMethod.sign(message, accessor);
		
	    var finalUrl = OAuth.addToURL(message.action, message.parameters);
	    
		var xhr = Titanium.Network.createHTTPClient();
		xhr.onload = function()
		{
			Ti.App.Properties.setString('accessToken', this.responseText.match(/oauth_token=([^&]+)&/)[1]);
			Ti.App.Properties.setString('accessTokenSecret', this.responseText.match(/oauth_token_secret=([^&]+)&/)[1]);	
		};
		xhr.onerror = function() {
			 Ti.UI.createAlertDialog({
                title: 'Error',
                message: 'Error getting access token.'
            }).show();
		};
		xhr.open('GET', finalUrl);
		xhr.send();

	};
	
	// Show Authorization Web View
	this.oauthWebView = function(params)
	{
		
		var t = Titanium.UI.create2DMatrix().scale(0);
		
		var win = Ti.UI.createWindow({
			backgroundColor:'#CCE6F0',
			borderWidth:4,
			borderColor:'#52D3FE',
			height:350,
			width:275,
			borderRadius:10,
			transform:t
        });

		// WebView
	    var authWebView = Ti.UI.createWebView({
				url: params.url
			});
		
		authWebView.addEventListener('load', getPIN);
	    win.add(authWebView);
		
		// Remove window button
		var cl = Ti.UI.createLabel({
			width: 24,
			height: 24,
			right: 10, 
			top: 10,
			borderRadius: 6,
			borderColor: '#52D3FE',
			backgroundColor: '#52D3FE',
			text: 'X',
			textAlign: 'center',
			font:{fontSize:11, fontWeight: 'bold'},
			color:'#fff'
		});
		
		cl.addEventListener('click', function(e){
			var a = Titanium.UI.createAnimation({opacity: 0, duration: 300});
			win.animate(a, function(){
				win.close();
			})
		});
		
		win.add(cl);
		
		win.open();
		
		// Window Animation
		var t1 = Ti.UI.create2DMatrix().scale(0);
		var t2 = Ti.UI.create2DMatrix().scale(1.1);
		var t3 = Ti.UI.create2DMatrix().scale(1.0);
		
		var a = Titanium.UI.createAnimation({transform: t1, duration: 300});
		var a2 = Titanium.UI.createAnimation({transform: t2, duration: 350});
		var a3 = Titanium.UI.createAnimation({transform: t3, duration: 400});
		
		win.animate(a);
		
		a.addEventListener('complete', function()
		{
			win.animate(a2);
		});
		
		a2.addEventListener('complete', function()
		{
			win.animate(a3);
		});
		
		// Set the window so we can remove it in the callback
		oauthWin = win;
	
	};
	
	// Request
	this.request = function(options, callback) {
		 
        var message = {
            method: options.method,
            action: options.action,
            parameters: [
			   ['oauth_signature_method', consumer.serviceProvider.signatureMethod],
	           ['oauth_consumer_key', consumer.consumerKey],
	           ['oauth_version', consumer.serviceProvider.oauthVersion],
	           ['oauth_token', accessToken]
			]
        };
        
		for (param in options.parameters) {
			message.parameters.push(options.parameters[param]);
		};
		
        OAuth.setTimestampAndNonce(message);
        OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
        OAuth.SignatureMethod.sign(message, accessor);
		
		var parameterMap = OAuth.getParameterMap(message.parameters);
		
		var xhr = Titanium.Network.createHTTPClient();
		xhr.onload = function()
		{
			 callback(this);
		};
		xhr.onerror = function() {
			 Ti.UI.createAlertDialog({
                title: 'Error',
                message: 'Error making request. ' + this.responseText
            }).show();
		};
		xhr.open(options.method, options.action);
		xhr.send(parameterMap);
		
	};

};