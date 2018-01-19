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
  setTimeout(hideSlide, timetoshow)
}

function showSlide(imagesToShow){
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
}

function setImages(images){
  $("#bannerArea").empty();

  $("#bannerArea").append("<ul id='rslides' class='rslides'></ul>");

  images.forEach(image => {
    $("#rslides").append("<li><img src=" + image.Url + "></li>")
  });
}

// Ux manipulation to show alert
// Receive callback to notify that the animation is finished
function toggleAlert(){
	var banner = $("#rslides");

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
