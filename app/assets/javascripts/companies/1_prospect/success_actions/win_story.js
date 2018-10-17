
function winStoryListeners () {

  var successId,
      $modal = $('#win-story-modal'),
      successPath = function (successId) { return '/successes/' + successId; },
      showWinStory = function (data, status, xhr) {

        console.log('data', data)

      },
      getWinStory = function (templates) {
        console.log('getWinStory()', templates)
        $.ajax({
          url: successPath(successId),
          method: 'GET',
          data: {
            templates: templates
          },
          dataType: 'html'
        })
          .done(showWinStory)
          .fail(function (a, b, c) {
            console.log(a, b, c)
            console.log('hello?');
          })
      };

  $(document)

    .on('click', '.success-actions .send-win-story', function (e) {
      // if ($(this).hasClass('disabled')) { return false; }
      successId = $(this).closest('tr').data('success-id');
      console.log(successId)
    })

    .on('change', 'select.invitation-templates', function (e) {

      getWinStory($(this).val());

    });
}