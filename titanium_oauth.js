Ti.include('sha1.js');
Ti.include('oauth.js');

var TitaniumOAuth = function(cs, ck, s) {
	
	var consumer = {
	    consumerKey:      ck,
	    consumerSecret:   cs,
	    serviceProvider: {
	        signatureMethod:     'HMAC-SHA1',
	        requestTokenURL:     'https://twitter.com/oauth/request_token',
	        userAuthorizationURL:'https://twitter.com/oauth/authorize',
	        accessTokenURL:      'https://twitter.com/oauth/access_token'
	    }
	};
	
	var accessor = {
	    consumerSecret: consumer.consumerSecret,
	    tokenSecret: ''
	};
	
	this.requestToken = function(){
	
		var requestUrl = 'https://api.twitter.com/oauth/request_token';
		var ck = 'n5xEd7gAUpktCCQbwoQ';
		var cks = 'DCOMziawWiNz1SNHQX04q5EdiXRGqhZHUCP9I6IPjKU';
		var accessor = {
		    consumerSecret: cks,
		    tokenSecret: ''
		};
		
		var message = {
		    method: "GET",
		    action: requestUrl,
		    parameters: [
		       ['oauth_signature_method', 'HMAC-SHA1'],
		       ['oauth_consumer_key', ck],
		       ['oauth_version', '1.0']
		   ]
		};
		
		OAuth.setTimestampAndNonce(message);
		OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
		OAuth.SignatureMethod.sign(message, accessor);
		
		var finalUrl = OAuth.addToURL(message.action, message.parameters);
		
		var xhr = Titanium.Network.createHTTPClient();
		xhr.onload = function(e)
		{
			return e.responseText;
		};
		xhr.open("GET",finalUrl);
		xhr.send();
	
	}
	
	
	
};

