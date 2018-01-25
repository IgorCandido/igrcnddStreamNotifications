var visible = false;

var typeOfNotification = [
	{notificationText: " is now following", type: "Follower", playAlert: function(){ nodecg.playSound("follower") }},
	{notificationText: " just subscribed!", type: "Subscriber", playAlert: function(){ nodecg.playSound("subscriber")}}
];

nodecg.listenFor('channel-followed', function(user){
	notification = {text : user.display_name, type: user.type, showtime: user.showtime};
	alert(notification);
});

// Event listener that triggers alert or queues if one is being showed currently
nodecg.listenFor('changeVisibility', alert);

function alert(d){
	d = d || {};

	queue.queue({show: () => showAlert(d), hide: () => hideAlert(d), showtime: d.showtime})
}

// This function shows alerts and triggers queued alerts
// Currently it is not possible to change the time between alerts as we are not receiving receiving the event that the notification is hidden
function showAlert(d){
	console.log("showing");

	var banner = $(".banner");
	var text = $("#text");

	// Set status on the alert
	var textToShow = d.text;
	if(d.type != null)
	{
		textToShow = d.text + typeOfNotification[d.type].notificationText;
	}

	text.text(textToShow);

	typeOfNotification[d.type].playAlert()

	animate.animateInOut(banner, true, "bounceInRight", "bannerOn")
}

function hideAlert(d){
	console.log("hiding");
	// Dispach queue when close animation is finished instead of based on hardcoded timeout
	animate.animateInOut(banner, false, "bounceOutRight", "bannerOn")
}
