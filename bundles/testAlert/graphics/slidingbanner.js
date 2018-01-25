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
  animate.show($("#bannerArea"), "bannerOn")
  slide.start(imagesToShow.timeperslide, imagesToShow.transitionsspeed, 1);
}

function hideSlide(){
  animate.hide($("#bannerArea"), "bannerOn")
  nodecg.log.info("hiding")
}

function setImages(images){
  $("#bannerArea").empty();

  $("#bannerArea").append("<ul id='slides' class='slides'></ul>");

  images.forEach(image => {
    $("#slides").append("<li><img class='slide' src=" + image.Url + "></li>")
  });
}
