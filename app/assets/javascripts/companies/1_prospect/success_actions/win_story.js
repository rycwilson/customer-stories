
function winStoryListeners () {

  var successId,
      $modal = $('#win-story-modal'),
      successPath = function (successId) { return '/successes/' + successId; },
      showWinStory = function (data, status, xhr) {
        $modal
          .find('.modal-body').children(':not(select, select +)').remove()
            .end()
          .append(data);
      },
      getWinStory = function (templates) {
        $.ajax({
          url: successPath(successId),
          method: 'GET',
          data: {
            templates: templates
          },
          dataType: 'html'
        })
          .done(showWinStory);
      };

  $(document)

    .on('click', '.success-actions .compose-win-story', function (e) {
      // if ($(this).hasClass('disabled')) { return false; }
      successId = $(this).closest('tr').data('success-id');
    })

    .on('change', 'select.invitation-templates', function (e) {
      getWinStory($(this).val());
    });
}