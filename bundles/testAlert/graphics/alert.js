var visible = false;

var typeOfNotification = [
	{notificationText: " is now following", type: "Follower", playAlert: function(){ nodecg.playSound("follower") }},
	{notificationText: " just subscribed!", type: "Subscriber", playAlert: function(){ nodecg.playSound("subscriber")}}
];

nodecg.listenFor('channel-followed', function(user){
	notification = {text : user.display_name, type: user.type};
	alert(notification);
});

// Event listener that triggers alert or queues if one is being showed currently
nodecg.listenFor('changeVisibility', alert);

var queue = function Queue(namespace){
	var innerQueue = [];
	namespace.showingAlert = false;

	// Tries to execute event if not possible queues it
	// Returns: true event can execute imediatly, false it was queue and should execute.
	namespace.queue = function (action){
								if(namespace.showingAlert){
									console.log("queuing");
									innerQueue.unshift(action);
									return;
								}
								action();
							}

	namespace.dispatch = function (){
								console.log("poping");
								var action = innerQueue.pop();

								if(action != null){
									console.log("dispaching popped");
									action();
									return;
								}

								console.log("nothing popped");
								queue.showingAlert = false;
							}

	return namespace;
}({});



function alert(d){
	d = d || {};

	queue.queue( () => showAlert(d) )
}

// This function shows alerts and triggers queued alerts
// Currently it is not possible to change the time between alerts as we are not receiving receiving the event that the notification is hidden
function showAlert(d){
	queue.showingAlert = true;
	console.log("showing");

	toggleAlert(d);
	setTimeout(function(){
		console.log("hiding");
		// Dispach queue when close animation is finished instead of based on hardcoded timeout
		toggleAlert(d);
		setTimeout(queue.dispatch, 2000);
	}, 5000);
}

// Ux manipulation to show alert
// Receive callback to notify that the animation is finished
function toggleAlert(d){
	var banner = $(".banner");
	var text = $("#text");

	if(visible){
		applyAnimation(d, banner, text, "bounceOutRight", false);
	}
	else{
		applyAnimation(d, banner, text, "bounceInRight", true);
		typeOfNotification[d.type].playAlert()
	}

	visible = !visible;
}

// Css magic to animate the alert in or out
function applyAnimation(d, element, text, animation, visible){
	animationString = animation + " animated"
	if(visible){
      	element.addClass("bannerOn");

      	var textToShow = d.text;
      	if(d.type != null)
      	{
      		textToShow = d.text + typeOfNotification[d.type].notificationText;
      	}

      	text.text(textToShow);
  }

	element.addClass(animationString).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
      $(this).removeClass(animationString);
      if(!visible){
      	element.removeClass("bannerOn");
      	text.text("");
      }
    });
}
