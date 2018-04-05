const Mixer = require('beam-client-node');
const app = require('express')();
const oauth2 = require('simple-oauth2')

const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

module.exports = function(nodecg, Twitch){
	var lastFollowRequest = nodecg.Replicant('lastFollowRequests', {defaultValue: "1970-01-01T00:00:00.000Z"});
	var followOffset = nodecg.Replicant('followOffset', {defaultValue: 0});
	var lastFollowRequestDate = new Date(lastFollowRequest.value);
	var trackingEvents = [{type: 0, display: "Followers", eventId: "channel-followed", resourceUrl: "/channels/{{username}}/follows",
	 												offset: nodecg.Replicant('followOffset', {defaultValue: 0}), lastObserved: nodecg.Replicant('lastFollowRequest', {defaultValue: "1970-01-01T00:00:00.000Z"}),
													lastObservedDate: function(){return new Date(this.lastObserved.value)},
													eventText: function(event){ return event.user.display_name },
													getElements: function(twitchResponse){ return twitchResponse.body.follows; }}]

	// Twitch API seems to only allow us to poll list of followers no ability to be notified of next new follower seems to be provided

  // Iterate over new events and push notification
	function NewNotification(nodecg, Twitch, trackingEvent){
		FetchEvents(nodecg, Twitch, trackingEvent, function(response){
			trackingEvent.getElements(response).forEach(event => {
				var eventDate = new Date(event.created_at);

				//New observed
				if(trackingEvent.lastObservedDate() < eventDate){
					nodecg.log.info("New event observed")
					nodecg.sendMessage(trackingEvent.eventId, {display_name : trackingEvent.eventText(event), type : trackingEvent.type, showtime: nodecg.Replicant('alertShowtime', {defaultValue: 2000}).value});

					trackingEvent.offset.value += 1;
					trackingEvent.lastObserved.value = eventDate.toISOString();
				}


			})
		});
	}



	// Get the next 25 next followers
	function FetchEvents(nodecg, Twitch, trackingEvent, callback){
		nodecg.log.info("Offset "+trackingEvent.offset.value)
		Twitch.get(trackingEvent.resourceUrl, {
				    limit: 25,
				    direction: 'asc',
				    offset: trackingEvent.offset.value
		}).then(response =>{
			if (response.statusCode !== 200) {
		        return nodecg.log.error(response.body.error, response.body.message);
		    }

		    callback(response);
		}).catch(err =>{
			nodecg.log.error(err);
		});
	}

	// Social links slides
	function PushSocials(){
			var socialImages = nodecg.Replicant('assets:socials').value;

			var socialBanner = {
														images: socialImages.map(image => { return { Url: image.url } }),
														timeperslide: nodecg.Replicant('timeperslide', {defaultValue: 1500}).value,
														transitionsspeed: nodecg.Replicant('transitionsspeed', {defaultValue: 1000}).value
												 }
			nodecg.log.info("pushing socials");

			nodecg.sendMessage("channel-slideshow", socialBanner);

			var periodforslides = nodecg.Replicant('periodforslides', {defaultValue: 30000}).value;

			nodecg.log.info("Socials Period " + periodforslides);

			setTimeout(PushSocials, periodforslides)
	}

	// Poll list of events
	setInterval(function(){
		nodecg.log.info("polling followers");
		// Follows
		NewNotification(nodecg, Twitch, trackingEvents[0]);
	}, 4000);

	var periodforslides = nodecg.Replicant('periodforslides', {defaultValue: 30000}).value;


	nodecg.log.info("periodVal " + periodforslides);

	// Show socials
	setTimeout(PushSocials, periodforslides)

	var oauthClient = oauth2.create({
		client : {
			id: '3836da539dc25dc874a72078c178daa2b438975665fd6e14'
		},
		auth: {
		 tokenHost: 'https://mixer.com/',
		 tokenPath: '/api/v1/oauth/token',
		 authorizePath: '/oauth/authorize'
	 },
	 options: {
        useBasicAuthorizationHeader: false,
    }
	});

	const authorizationUri = oauthClient.authorizationCode.authorizeURL({
	  redirect_uri: 'http://localhost:9090/testAlert/callback',
	  scope: 'channel:analytics:self achievement:view:self',
	  state: '3(#0/!~',
	});

	app.get('/testAlert/testAuth', (req, res) => {
	  console.log(authorizationUri);
	  res.redirect(authorizationUri);
	});

	app.get('/testAlert/callback', async (req, res) => {
	  const code = req.query.code;
	  const options = {
			code: code,
			redirect_uri: 'http://localhost:9090/testAlert/callback'
	  };

	  try {
			console.log("getting token");

	    const result = await oauthClient.authorizationCode.getToken(options);

	    console.log('The resulting token: ', result);

	    const token = oauthClient.accessToken.create(result);

			client.use(new Mixer.OAuthProvider(client, {
		    tokens: {
		        access: token.token.access_token,
		        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
		    }
			}));

			client.request('GET', 'users/current')
			.then(response => {
			    console.log(response.body);
					return response;
			}).then(response =>{
				console.log(response.body);
				client.request('GET', `channels/${response.body.channel.id}/analytics/viewers?from=2018-04-04T00:00:00.000Z&to=2018-04-06T00:00:00.000Z`)
				.then(res => {
				    const body = JSON.stringify(res.body);
				    console.log(`You have ${body} total viewers...`);
				});
			})



	    return res.redirect("/dashboard")
	  } catch(error) {
	    console.error('Access Token Error', error.message);
	    return res.status(500).json('Authentication failed');
	  }
	});


	nodecg.mount(app);

}




/* username = response.body.follows.reverse()[0].user.name;

		    nodecg.sendMessage("channel-followed", { display_name : username}); */

/*response.body.follows.forEach(follow => {
		    	const username = follow.user.name;
		    	console.log("%s followed the channel %s", username, Twitch.channel);
		    });*/
