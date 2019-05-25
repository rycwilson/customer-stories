
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
    }, 600);
    animationCount++;
  }, 4000);

  $('#image-horizontal-sm .slide-up-down #text2')
    .textfill({
      minFontPixels: 10,
      maxFontPixels: 16
    });

  $('#text-horizontal-sm .short-headline')
    .textfill({
      minFontPixels: 12,
      maxFontPixels: 22
    });

  $('#text-horizontal-sm .long-headline')
    .textfill({
      minFontPixels: 13,
      maxFontPixels: 18,
    });

  $('#text-vertical .short-headline')
    .textfill({
      minFontPixels: 25,
      maxFontPixels: 32,
    });
  $('#text-vertical .long-headline')
    .textfill({
      minFontPixels: 20,
      maxFontPixels: 25,
    });

  $('#image-logo .long-headline')
    .textfill({
      minFontPixels: 10,
      maxFontPiexls: 16
    });

  $('#image-no-logo .long-headline')
    .textfill({
      minFontPixels: 10,
      maxFontPiexls: 16,
      complete: function () {
        var $url = $('#image-no-logo #url'),
            $longHeadline = $('#image-no-logo .long-headline span');
        if (parseInt($longHeadline.css('font-size'), 10) <= 14) {
          $url.css('font-size', $longHeadline.css('font-size'));
        } else {
          $url.css('font-size', '14px');
        }
        if ($url.css('font-size') === '10px') {
          $url.css('top', '231px');
        } else if ($url.css('font-size') === '12px') {
          $url.css('top', '228px');
        } else if ($url.css('font-size') === '14px') {
          $url.css('top', '226px');
        }
      }
    });

  $('#text-square .long-headline')
    .textfill({
      minFontPixels: 20,
      maxFontPixels: 26
    });

  $('#image-vertical .long-headline')
    .textfill({
      minFontPixels: 14,
      maxFontPixels: 18
    });

});