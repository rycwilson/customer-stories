
function initMasonry () {
  if ($('body').hasClass('stories index')) {

    $('.grid')
      .masonry({
         itemSelector: '.grid-item',
         columnWidth: 220,
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
}