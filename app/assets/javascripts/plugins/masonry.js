
function initMasonry () {

  var $gallery = $('.grid');

  $gallery.masonry({
             itemSelector: '.grid-item',
             columnWidth: 220,
             isFitWidth: true,
             // disable initial layout ...
             // isInitLayout: false
           });

  $gallery.masonry('on', 'layoutComplete', function () {
    centerLogos();
  });

  // manually trigger initial layout ...
  // set isInitLayout to false (default is true);
  // allows for adding events or methods prior to initial layout )

  // $grid.masonry();

}