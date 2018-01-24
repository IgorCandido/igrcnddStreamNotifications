var visible = false;

/*
{
  timeperslide: ,
  transitionsspeed: ,
  images: [
     {
        Url:
     },
     {
       Url:
    }
  ]
}
*/



nodecg.listenFor("channel-slideshow", function(imagesToShow){
  display(imagesToShow);
  nodecg.log.info("showing")
})

function display(imagesToShow){
  // We want to show the slider for inner transitions + time per slide, being that number of transitions is number o images minus the first intro
  var timetoshow = (imagesToShow.transitionsspeed * (imagesToShow.images.length - 1)) + (imagesToShow.timeperslide * imagesToShow.images.length)
  showSlide(imagesToShow);
}

function showSlide(imagesToShow){
  setImages(imagesToShow.images);
  slide.callback = hideSlide;
  slide.start(imagesToShow.timeperslide, imagesToShow.transitionsspeed, 1);
}

function hideSlide(){
  toggleSlide();
  nodecg.log.info("hiding")
}

/* function showSlide(imagesToShow){
  setImages(imagesToShow.images);
  $(".rslides").responsiveSlides(
    {
      speed: imagesToShow.transitionsspeed,
      timeout: imagesToShow.timeperslide
    });
  $(".rslides").addClass("banner");
  toggleAlert();
}

function hideSlide(){
  if(!visible){
    return;
  }

  toggleAlert();
  nodecg.log.info("hiding")
} */

function setImages(images){
  $("#bannerArea").empty();

  $("#bannerArea").append("<ul id='slides' class='slides'></ul>");

  images.forEach(image => {
    $("#slides").append("<li><img class='slide' src=" + image.Url + "></li>")
  });
}

// Ux manipulation to show alert
// Receive callback to notify that the animation is finished
function toggleSlide(){
	var banner = $("#slides");

	if(visible){
		applySlideShowAnimation(banner, "bounceOutRight", false);
	}
	else{
		applySlideShowAnimation(banner, "bounceInRight", true);
	}

	visible = !visible;
}

// Css magic to animate the alert in or out
function applySlideShowAnimation(element, animation, visible){
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
