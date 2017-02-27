var visible = false;
var showingAlert = false;
var queue = [];

// Event listener that triggers alert or queues if one is being showed currently
nodecg.listenFor('changeVisibility', function(data) {
	var notification = {notification : data};
	if(showingAlert){
		console.log("queuing");
		queue.unshift(notification);
		return;
	}

	showAlert(notification);
});

// This function shows alerts and triggers queued alerts
// Currently it is not possible to change the time between alerts as we are not receiving receiving the event that the notification is hidden
function showAlert(data){
	showingAlert = true;
	console.log("showing");
	toggleAlert();
	setTimeout(function(){ 
		console.log("hiding");
		// Dispach queue when close animation is finished instead of based on hardcoded timeout
		toggleAlert();
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
function toggleAlert(){
	var banner = $(".banner");

	if(visible){
		applyAnimation(banner, "bounceOutRight", false);
	}
	else{
		applyAnimation(banner, "bounceInRight", true);
	}

	visible = !visible;
}

// Css magic to animate the alert in or out
function applyAnimation(element, animation, visible){
	animationString = animation + " animated"
	if(visible){
      	element.addClass("bannerOn");
    }

	element.addClass(animationString).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
      $(this).removeClass(animationString);
      if(!visible){
      	element.removeClass("bannerOn");
      }
    });
}