module.exports = function(nodecg, Twitch){
	var lastFollowRequest = nodecg.Replicant('lastFollowRequests', {defaultValue: "1970-01-01T00:00:00.000Z"});
	var followPage = nodecg.Replicant('followerPage', {defaultValue: 0});
	var lastFollowRequestDate = new Date(lastFollowRequest.value); 


	function NewFollowers(nodecg, Twitch){
		FetchFollowers(nodecg, Twitch, function(followerResponse){
			followerResponse.body.follows.forEach(follow => {
				var followDate = new Date(follow.created_at);
				
				//New follow observed
				if(lastFollowRequestDate < followDate){
					nodecg.sendMessage("channel-followed", {display_name : follow.user.display_name});

					lastFollowRequestDate = followDate;
					lastFollowRequest.value = lastFollowRequestDate.toISOString();
				}
			})
		});
	}

	function FetchFollowers(nodecg, Twitch, callback){
		Twitch.get('/channels/{{username}}/follows', {
				    limit: 25,
				    direction: 'asc',
				    offset: followPage.value
		}).then(response =>{
			if (response.statusCode !== 200) {
		        return nodecg.log.error(response.body.error, response.body.message);
		    }

		    followPage.value += 1;

		    callback(response);		    
		}).catch(err =>{
			nodecg.log.error(err);
		});
	}

	setInterval(function(){
		nodecg.log.info("polling followers");
		NewFollowers(nodecg, Twitch);
	}, 4000);
}


/* username = response.body.follows.reverse()[0].user.name;

		    nodecg.sendMessage("channel-followed", { display_name : username}); */

/*response.body.follows.forEach(follow => {
		    	const username = follow.user.name;
		    	console.log("%s followed the channel %s", username, Twitch.channel);
		    });*/