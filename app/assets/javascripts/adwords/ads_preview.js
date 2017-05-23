
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

  $('#image-horizontal-sm .slide-up-down #text2')
    .textfill({
      minFontPixels: 10,
      maxFontPixels: 16,
      debug: true
    });

  $('#text-horizontal-sm .short-headline')
    .textfill({
      minFontPixels: 12,
      maxFontPixels: 22
    });

  $('#text-horizontal-sm .long-headline')
    .textfill({
      minFontPixels: 10,
      maxFontPixels: 16,
      explicitHeight: 50,
      explicitWidth: 250
    });


});