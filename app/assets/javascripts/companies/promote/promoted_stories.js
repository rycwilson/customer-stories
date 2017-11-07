
function promotedStoriesListeners () {

  $(document)

    // change long headline
    .on('click', 'td.promoted-story-title', function () {
      var $row = $(this).parent();
      openPromotedStoriesEditor(promotedStoriesEditor, $row);
    })

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

    // ad previews - separate window
    .on('click', '.promoted-story-actions .preview', function () {
      var storyId = $(this).closest('tr').data('story-id');
      window.open('/stories/' + storyId +
                  '/sponsored_story_preview', '_blank');
    });

}