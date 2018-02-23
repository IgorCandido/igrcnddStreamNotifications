module.exports = function(nodecg, Twitch){
	var trackingEvents = [{type: 0, display: "Followers", eventId: "channel-followed", resourceUrl: "/channels/{{username}}/follows",
													lastObservedDate: function(){return new Date(this.lastObserved.value)},
													eventText: function(event){ return event.user.display_name },
													getElements: function(twitchResponse){ return twitchResponse.body.follows; },
													elementsPerPage: 25,
												  endCycle: function(response){
																											 nodecg.log.info("Response total: " + response._total +" and offset is "+ this.offset.value)
																											 // We lost followers :(
														 													 if(response._total == 0){
																												 // We didn't had any :(
																												 if(this.offset.value == 0){
																													 return;
																												 }
																												 --this.offset.value;
																											 };}}]

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

					trackingEvent.lastObserved.value = eventDate.toISOString();
				}

				if(trackingEvent.lastObservedDate() != eventDate)
				{
						trackingEvent.offset.value += 1;
				}

			})
			trackingEvent.endCycle(response.body);
		});
	}



	// Get the next 25 next followers
	function FetchEvents(nodecg, Twitch, trackingEvent, callback){
		nodecg.log.info("Offset "+trackingEvent.offset.value)
		Twitch.get(trackingEvent.resourceUrl, {
				    limit: trackingEvent.elementsPerPage,
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
}




/* username = response.body.follows.reverse()[0].user.name;

		    nodecg.sendMessage("channel-followed", { display_name : username}); */

/*response.body.follows.forEach(follow => {
		    	const username = follow.user.name;
		    	console.log("%s followed the channel %s", username, Twitch.channel);
		    });*/
