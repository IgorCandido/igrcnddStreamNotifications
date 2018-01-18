module.exports = function(nodecg, Twitch){
	var lastFollowRequest = nodecg.Replicant('lastFollowRequests', {defaultValue: "1970-01-01T00:00:00.000Z"});
	var followOffset = nodecg.Replicant('followOffset', {defaultValue: 0});
	var lastFollowRequestDate = new Date(lastFollowRequest.value);
	var trackingEvents = [{type: 0, display: "Followers", eventId: "channel-followed", resourceUrl: "/channels/{{username}}/follows",
	 												offset: nodecg.Replicant('followOffset', {defaultValue: 0}), lastObserved: nodecg.Replicant('lastFollowRequestx', {defaultValue: "1970-01-01T00:00:00.000Z"}),
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
					nodecg.sendMessage(trackingEvent.eventId, {display_name : trackingEvent.eventText(event), type : trackingEvent.type});

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

	// Poll list of events
	setInterval(function(){
		nodecg.log.info("polling followers");
		// Follows
		NewNotification(nodecg, Twitch, trackingEvents[0]);
	}, 4000);
}


/* username = response.body.follows.reverse()[0].user.name;

		    nodecg.sendMessage("channel-followed", { display_name : username}); */

/*response.body.follows.forEach(follow => {
		    	const username = follow.user.name;
		    	console.log("%s followed the channel %s", username, Twitch.channel);
		    });*/
