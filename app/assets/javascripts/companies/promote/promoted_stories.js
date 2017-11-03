
function promotedStoriesListeners () {

  $(document)

    // change status
    .on('click', 'td.status-dropdown .dropdown-menu a.pause, ' +
                 'td.status-dropdown .dropdown-menu a.enable', function () {
      var storyId = $(this).closest('tr').data('story-id');

      $(this).closest('.dropdown')
             .find('a.dropdown-toggle')
             .toggleClass('enabled paused')
             .children(':first')
             .toggleClass('fa-play fa-pause');
      $(this).closest('.dropdown-menu').children('li').toggle();

      // first update story.promote and return positive json response,
      // then send a request to update adwords
      $.ajax({
        url: '/stories/' + storyId + '/promote',
        method: 'put',
        data: {
          adwords: {
            status: $(this).attr('class') === 'enable' ? 'ENABLED' : 'PAUSED',
          }
        },
        dataType: 'json',
        success: function (data, status, xhr) {
          $.ajax({
            url: '/stories/' + storyId + '/adwords',
            method: 'put',
            data: { status_changed: true },
            dataType: 'script'
          });
        },
      });

    })

    // story image select
    .on('click', 'td.promoted-story-image .thumbnail', function () {
      // if <= 1, there is no alterative to the current image
      if ( $('#ad-image-select-modal li').length <= 1 ) { return false; }

      var $modal = $('#ad-image-select-modal'),
          storyId = $(this).closest('tr').data('story-id'),
          currentImageUrl = $(this).children('img').attr('src'),
          template = _.template( $('#adwords-image-select-form-template').html() );

      // remove any query param that was used to refresh an image
      if (currentImageUrl.match(/\?\d+/)) {
        currentImageUrl = currentImageUrl.slice(0, currentImageUrl.lastIndexOf('?'));
      }

      // hide the current image
      $modal.find('img[src="' + currentImageUrl + '"]')
            .closest('li').addClass('hidden');
      // add the form
      $modal.find('.modal-footer').empty()
            .append( template({ storyId: storyId }) );
      $modal.modal('show');
    })


    // ad previews - separate window
    .on('click', '.promoted-story-preview a', function () {
      var storyId = $(this).closest('tr').data('story-id');
      window.open('/stories/' + storyId +
                  '/sponsored_story_preview', '_blank');
    })

}