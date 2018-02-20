const request = require('request-promise');
const app = require('express')();
const path = require('path');
const pubsub = require( path.resolve( __dirname, "./twitchpubsub.js" ) );
let accessToken;
let channelId;
let _session;
let socket;

module.exports = function(nodecg, Twitch){
	var lastFollowRequest = nodecg.Replicant('lastFollowRequests', {defaultValue: "1970-01-01T00:00:00.000Z"});
	var followOffset = nodecg.Replicant('followOffset', {defaultValue: 0});
	var lastFollowRequestDate = new Date(lastFollowRequest.value);
	var trackingEvents = [{type: 0, display: "Followers", eventId: "channel-followed", resourceUrl: "/channels/{{username}}/follows",
	 												offset: nodecg.Replicant('followOffset', {defaultValue: 0}), lastObserved: nodecg.Replicant('lastFollowRequestx', {defaultValue: "1970-01-01T00:00:00.000Z"}),
													lastObservedDate: function(){return new Date(this.lastObserved.value)},
													eventText: function(event){ return event.user.display_name },
													getElements: function(twitchResponse){ return twitchResponse.body.follows; }}]


	const loginLib = require('../../lib/login');

	// Non-confidential session details are made available to dashboard & view
	const sessionReplicant = nodecg.Replicant('session', {defaultValue: null, persistent: false});

	// Capture the relevant session data the moment our user logs in
	loginLib.on('login', session => {
		const user = session.passport.user;
		_session = session;

		nodecg.log.info("Received Login with access Token:" + user.accessToken)
		if (user.provider === 'twitch' && user.username === nodecg.bundleConfig.username) {
			// Update the 'session' syncedconst with only the non-confidential information
			sessionReplicant.value = {
				provider: user.provider, // should ALWAYS be 'twitch'
				username: user.username,
				displayName: user.displayName,
				logo: user._json.logo,
				url: user._json._links.self
			};
			accessToken = user.accessToken;
		}
	});

	app.get('/testAlert/checkuser', (req, res) => {
		nodecg.log.info("Updated Login with access Token: " + req.session.passport.user.accessToken)

		nodecg.log.info("fetching channelId")
		Twitch.get("/channel").then(response => {
			if (response.statusCode !== 200) {
		        return nodecg.log.error(response.body.error, response.body.message);
		    }
				// Got channel id
				nodecg.log.info("Got Channel Id: " + response.body._id)
		    channelId = response.body._id;

				// Connect to pub sub
				subscribeToPubSub();

		}).catch(err =>{
			nodecg.log.error(err);
		});

		if (req.session.passport && req.session.passport.user) {
			const user = req.session.passport.user;
			if (user.username === nodecg.bundleConfig.username) {
				// Update the 'session' Replicant with only the non-confidential information
				sessionReplicant.value = {
					provider: user.provider, // should ALWAYS be 'twitch'
					username: user.username,
					displayName: user.displayName,
					logo: user._json.logo,
					url: user._json._links.self
				};
				accessToken = user.accessToken;
				_session = req.session;
			}
		}

		res.sendStatus(200);
	});

	nodecg.mount(app);

	function subscribeToPubSub(){
		socket = new pubsub("wss://pubsub-edge.twitch.tv", channelId, accessToken, nodecg)

		socket.onOpen = function() {
			nodecg.log.info("Connection established")

			// Bits
			nodecg.log.info("Subscribed bits")
			socket.subscribe("bits")

			// Subs
			nodecg.log.info("Subscribed subs")
			socket.subscribe("subs")
		}

		socket.onReceive = function(topic, type, message){
			nodecg.log.info("Received from topic " + text + " with of type " + type + " with content " + message)
		}

		socket.onClose = function(code, reason) {
			nodecg.log.info("Connection closed by "+JSON.stringify(reason) + " with code " + code)
		}
	}


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
}




/* username = response.body.follows.reverse()[0].user.name;

		    nodecg.sendMessage("channel-followed", { display_name : username}); */

/*response.body.follows.forEach(follow => {
		    	const username = follow.user.name;
		    	console.log("%s followed the channel %s", username, Twitch.channel);
		    });*/
