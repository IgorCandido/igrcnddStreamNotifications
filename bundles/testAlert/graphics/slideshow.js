var slide;

slide = function(namespace){
  var slides;
  var numberOfSlides;
  var numberOfRuns;
  var running = false;
  var nextSlideInterval;
  var currentSlide = 0;

  namespace.stop = function(){
    running = false;
    if(nextSlideInterval != null){
      clearInterval(nextSlideInterval);
    }

    currentSlide = 0;
  }

  namespace.start = function(timePerSlide, timeBetweenSlides, runs){
    namespace.stop();

    slides = $("#slides .slide");
    numberOfSlides = slides.length;
    numberOfRuns = runs;
    running = true;
    if(slides.length == 0){
      nodecg.log.warn("No images provided");
      return;
    }

    nextSlide(timeBetweenSlides)
    setInterval(() => nextSlide(timeBetweenSlides), timePerSlide);
  }

  function nextSlide(timeBetweenSlides){
    if(running == false){
      return;
    }

    // Got to the end of the slideshow
    if(currentSlide == numberOfSlides){
      // Only care if run for a number of times
      if(numberOfRuns != null && (--numberOfRuns) == 0 ){
        namespace.stop()
        namespace.callback || namespace.callback();
      }
    }

    changeSlide(timeBetweenSlides);
  }

  function changeSlide(timeBetweenSlides){
    toggleAlert(slides[currentSlide], false, timeBetweenSlides, () => {
                                                                        ++currentSlide;
                                                                        toggleAlert(slides[currentSlide], true, timeBetweenSlides);
                                                                      })

  }

  // Ux manipulation to show alert
  // Receive callback to notify that the animation is finished
  function toggleAlert(slide, show, timeBetweenSlides, next) {

  	if(show){
  		applyAnimation(slide, "bounceInRight", true, timeBetweenSlides, next);
  	}
  	else{
  		applyAnimation(slide, "bounceOutRight", false, timeBetweenSlides, next);
  	}
  }

  // Css magic to animate the alert in or out
  function applyAnimation(element, animation, visible, timeBetweenSlides, next){
    element = $(element);
    element.css({'animationDuration' : timeBetweenSlides+"ms"});
  	animationString = animation + " animated"
  	if(visible){
  	   element.addClass("bannerOn");
    }

  	element.addClass(animationString).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
        $(this).removeClass(animationString);
        if(!visible){
        	element.removeClass("bannerOn");
        }

        if(next != null){
          next();
        }
      });
  }

  namespace.callback = function(){}

  return namespace;
}(slide || {})
