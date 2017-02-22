nodecg.listenFor('changeVisibility', function(show) {
	var banner = $(".banner");

	if(!show){
		banner.removeClass("bannerOn");
	}
	else{
		banner.addClass("bannerOn")
	}
});