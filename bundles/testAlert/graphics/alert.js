var visible = false;
var showingAlert = false;
var queue = [];
var typeOfNotification = [{notificationText: " is now following", type: "Follower"}];

nodecg.listenFor('channel-followed', function(user){
	notification = {text : user.display_name, type: user.type};
	alert(notification);
});

// Event listener that triggers alert or queues if one is being showed currently
nodecg.listenFor('changeVisibility', alert);

function alert(d){
	d = d || {};
	if(showingAlert){
		console.log("queuing");
		queue.unshift(d);
		return;
	}

	showAlert(d);
}

// This function shows alerts and triggers queued alerts
// Currently it is not possible to change the time between alerts as we are not receiving receiving the event that the notification is hidden
function showAlert(d){
	showingAlert = true;
	console.log("showing");

	toggleAlert(d);
	setTimeout(function(){ 
		console.log("hiding");
		// Dispach queue when close animation is finished instead of based on hardcoded timeout
		toggleAlert(d);
		setTimeout(dispatchQueued, 2000);
	}, 5000);
}

// Retriggers one queued alert
function dispatchQueued(){
	var alert;
	console.log("poping");
	alert = queue.pop();

	if(alert != null){
		console.log("dispaching popped");
		showAlert(alert);
		return;	
	}
	
	console.log("nothing popped");
	showingAlert = false;
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