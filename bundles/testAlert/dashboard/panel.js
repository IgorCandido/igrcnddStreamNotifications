var typeOfNotification = [{notificationText: " is now following", type: "Follower"}];

fetch('/testAlert/checkuser', {method: 'GET', credentials: 'include'});

$( document ).ready(function() {

	$("#toggle").click(function(){
		var followertest = $("#followerName").val();
		nodecg.sendMessage("channel-followed", {display_name : followertest, type : 0, showtime: nodecg.Replicant('alertShowtime', {defaultValue: 2000}).value});
		$("#followerName").val("");
	});
});

var viewers = nodecg.Replicant('ChannelViewersTotal', {defaultValue: 0});

viewers.on('change', function(newValue, oldValue) {
	console.log("Viewers from " + oldValue + "to new value " + newValue);
    document.getElementById("viewers").textContent = newValue;
});

nodecg.listenFor('channel-followed', function(user){
	$("#event").text(user.display_name + typeOfNotification[user.type].notificationText);
});
