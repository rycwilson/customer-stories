
$(function () {

  $('.grid').masonry({
               itemSelector: '.grid-item',
               columnWidth: 160,
               gutter: 30,
               // isFitWidth: true,
               // disable initial layout ...
               isInitLayout: false
             });

  // manually trigger initial layout ...
  // set isInitLayout to false (default is true);
  $('.grid').imagesLoaded(function () {
    $('.grid').masonry();
  });

  $('.grid').masonry('on', 'layoutComplete', function () {
    $('.grid').css('visibility', 'visible');
  });

  var animationCount = 0;

  setInterval(function () {
    $('.slide-up-down').animate({
      top: (animationCount % 2 === 0) ? '-=50' : '+=50'
    });
    animationCount++;
  }, 4000);

});