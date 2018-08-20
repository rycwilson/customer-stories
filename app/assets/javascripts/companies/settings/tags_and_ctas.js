
function storyTagsListeners () {

}

function storyCTAsListeners () {

  var validCollapseClick;

  $(document)

    .on('click', '.cta-description', function () {
      if (!$(this).is('[class*="remove"]')) {
        $(this).next().collapse('toggle');
      }
    })

    .on('click', '#story-ctas [class*="remove"]', function () {
      var id = $(this).closest('li').data('cta-id');
      $.ajax({
        url: '/ctas/' + id,
        method: 'delete',
        dataType: 'json'
      })
        .done(function (data, status, xhr) {
          if (data.isPrimary) {
            $('#primary-cta li').empty().append('<em>Add a primary CTA</em>');
          } else {
            $('li[data-cta-id="' + data.id + '"]').remove();
          }
        });
    })

    .on('click', '#new-cta-form .btn-group input', function () {
      $('.link-input, .html-input').toggle();
      $('.link-input, .html-input').val('');
    });

}