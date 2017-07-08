
function curate () {
  initGallery();
}

function curateListeners () {

  $(document)
    .on('click', '#curate-gallery a.logo-published, #curate-gallery a.pending-curation',
      function (e) {
        e.preventDefault();
        var $story = $(this).closest('li');
        $.ajax({
          url: '/stories/' + $story.data('story-id') + '/edit',
          method: 'get',
          dataType: 'html',
          success: function (html, status, xhr) {
            $('#curate-panel .container').children()
                .fadeOut({ duration: 150, easing: 'linear',
                  complete: function () {
                    $('#curate-panel .container').append(html)
                      .fadeIn({ duration: 150, easing: 'linear' });
                  }
              });
            initContributorsTable('curate');
            var $table = $('#curate-contributors-table'), dt = $table.DataTable(),
                curatorCol = $table.data('curator-col'),
                curatorId = app.current_user.id,
                successCol = $table.data('success-col'),
                successId = $('#story-settings-tab-pane').data('success-id');
            dt.columns(curatorCol).search(curatorId)
              .columns(successCol).search(successId)
              .draw();
          }
        });
      });

}

function initGallery () {
  var template = _.template($('#stories-template').html());
  $('#curate-gallery').append(
    template({
      stories: app.stories,
      isCurator: true,
    })
  );

}