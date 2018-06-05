
//= require_tree ./shared
//= require ./index
//= require ./show
//= require ./edit/edit
//= require ./grid_previews

function attachStoriesListeners () {

  storiesIndexListeners();
  storiesEditListeners();
  playVideoListener();
  newStoryListeners();

  $(document).on('click', '.cta-form',
    function () {
      $('#outbound-form-modal').modal('show');
    });

  // this does not play nicely with the linkedin widgets
  // if scroll while widgets are loading, somehow visibility gets set to
  // hidden, but the More Stories header doesn't appear
  // document.addEventListener('scroll', function () {
  //   if ($('body').hasClass('stories show') &&
  //       $('#more-stories-container').css('visibility') === 'hidden' &&
  //       ($(window).scrollTop() - $('#testimonial').offset().top) > 0) {
  //         initMoreStories();
  //       }
  // });

}
