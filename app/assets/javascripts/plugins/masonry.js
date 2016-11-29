
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

  // without this delay, styling comes out screwy
  // TODO: something less hacky; css solution would be nice
  // setTimeout(function () {
  //   $gallery.css('visibility', 'visible');
  // }, 500);

  // manually trigger initial layout ...
  // set isInitLayout to false (default is true);
  $('.grid').imagesLoaded(function () {
    $('.grid').masonry();
    setTimeout(function () { centerLogos(); }, 500);
  });

}