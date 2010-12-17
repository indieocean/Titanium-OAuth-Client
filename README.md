Titanium OAuth Client
================================

What is it?
---------------------------------------
This is a very simple and user friendly OAuth Client for Titanium Mobile. I'm currently using it for Twitter.

It's a work in progress not for production use.

How do I use it?
---------------------------------------
Example:

	var oauth = new TitaniumOAuth('Consumer key','Consumer secret');
	
	var options = {
		        method: 'POST',
		        action: 'https://api.twitter.com/1/statuses/update.json',
		        parameters: [
		           ['status', 'Just installed an App for the iPhone.']
		       ]
		    };
	
	var request_callback = function(){
		oauth.request(options);
	};
	
	oauth.requestToken(request_callback);





