var visible = false;

nodecg.listenFor('changeVisibility', function() {
	toggleAlert();
});

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