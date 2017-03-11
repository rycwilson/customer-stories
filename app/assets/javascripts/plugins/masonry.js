
function initMasonry () {

  var columnWidth, gutter;

  if ($('body').hasClass('stories index')) {
    columnWidth = 220;
  } else if ($('body').hasClass('stories show')) {
    columnWidth = 150;
    gutter = 25;
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