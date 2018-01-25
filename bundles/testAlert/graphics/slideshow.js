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
      clearTimeout(nextSlideInterval);
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
    currentSlide = 0;

    animate.animateInOut(slides[currentSlide], true, "bounceInRight", "bannerOn", timeBetweenSlides, () => nextSlideInterval = setTimeout(nextSlide(timeBetweenSlides, timePerSlide), timeBetweenSlides));
  }

  function nextSlide(timeBetweenSlides, timePerSlide){
    if(running == false){
      return;
    }

    // Got to the end of the slideshow
    if(currentSlide == (numberOfSlides - 1)){
      // Only care if run for a number of times
      if(numberOfRuns != null && (--numberOfRuns) == 0 ){
        // Transition out the last slide visble
        animate.animateInOut(slides[currentSlide], false, "bounceOutRight", "bannerOn", timeBetweenSlides, () => {
                                                                            if(namespace.callback != null){
                                                                               namespace.callback();
                                                                            }

                                                                            namespace.stop()
                                                                          })

      }
    }

    changeSlide(timeBetweenSlides, timePerSlide);
  }

  function changeSlide(timeBetweenSlides, timePerSlide){
    animate.animateInOut(slides[currentSlide], false, "bounceOutRight", "bannerOn", timeBetweenSlides, () => {
                                                                        ++currentSlide;
                                                                        animate.animateInOut(slides[currentSlide], true, "bounceInRight", "bannerOn", timeBetweenSlides,() => nextSlideInterval = setTimeout(nextSlide(timeBetweenSlides, timePerSlide), timePerSlide))
                                                                      })

  }

  namespace.callback = function(){}

  return namespace;
}(slide || {})
