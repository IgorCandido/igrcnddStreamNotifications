var animate;

animate = function(namespace){

  // Ux manipulation to show alert
  // Receive callback to notify that the animation is finished
  namespace.animateInOut = function(element, show, animation, visibleCssClass, animationSpeed, callback){
    animation =  animation || "bounceOutRight";

    if(animationSpeed != null){
      $(element).css({'animationDuration' : animationSpeed+"ms"});
    }

    animationString = animation + " animated"
  	if(show){
  	   $(element).addClass(visibleCssClass);
    }
    nodecg.log.info("startAnimation")
    // Css magic to animate the alert in or out
  	$(element).addClass(animationString).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
                                          () => {
                                              endAnimation(element, show, animationString, visibleCssClass);

                                              // Notify that animation has ended
                                              if(callback != null){
                                                  callback();
                                              }
                                          });
  }

  namespace.show = function(element, visibleCssClass){
    $(element).addClass(visibleCssClass);
  }

  namespace.hide = function(element, visibleCssClass){
    $(element).removeClass(visibleCssClass);
  }

  // Act after the animation has runned, mainly hide element animated out and remote animation css class
  function endAnimation(element, show, animationString, visibleCssClass){
    nodecg.log.info("endAnimation "+show)

    $(element).removeClass(animationString);
    if(!show){
      $(element).removeClass(visibleCssClass);
    }
  }

  return namespace;
}(animate || {});
