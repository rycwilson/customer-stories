
function initMasonry () {

  var columnWidth, gutter;

  if ($('body').hasClass('stories index')) {
    columnWidth = 210;
    if (CSP.screenSize === 'lg' || CSP.screenSize === 'md') {
      gutter = 60;
    } else {
      gutter = 40;
    }
  } else if ($('body').hasClass('stories show')) {
    columnWidth = 210;
    if (CSP.screenSize === 'lg') {
      gutter = 50;
    } else if (CSP.screenSize === 'md') {
      gutter = 35;
    }
  }

  $('.grid').masonry({
               itemSelector: '.grid-item',
               columnWidth: columnWidth,
               gutter: gutter,
               isFitWidth: true,
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

}