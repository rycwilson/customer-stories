
function imageSelectModalListeners () {

  $(document)

    // story image select
    .on('click', 'td.promoted-story-image .thumbnail', function () {
      var $modal = $('#ad-image-select-modal'),
          storyId = $(this).closest('tr').data('story-id'),
          currentImageUrl = $(this).children('img').attr('src'),
          template = _.template( $('#adwords-image-select-form-template').html() );

      // remove any query param that was used to refresh an image
      if (currentImageUrl.match(/\?\d+/)) {
        currentImageUrl = currentImageUrl.slice(0, currentImageUrl.lastIndexOf('?'));
      }

      // hide the current image
      // $modal.find('img[src="' + currentImageUrl + '"]')
      //       .closest('li').addClass('hidden');
      // add the form
      $modal.find('.modal-footer').empty()
            .append( template({ storyId: storyId }) );
      $modal.modal('show');
    })

    // on selecting an image, update a hidden field containing the selected image id
    .on('click', '#ad-image-select-modal .thumbnail', function () {
      if ($(this).hasClass('selected')) {
        return false;
      } else {
        var selectedImageId = $(this).closest('li').data('image-id');
        $(this).closest('.modal-content')
               .find('button[type="submit"]').prop('disabled', false);
        $(this).addClass('selected');
        // update the form's hidden field for image id
        $(this).closest('.modal-content').find('.modal-footer input[type="hidden"]')
               .val(selectedImageId);
        $('#ad-image-select-modal .thumbnail')
          // thumbnail is the raw html, $(this) is jquery
          .each(function (index, thumbnail) {
            if ($(this).closest('li').data('image-id') !== selectedImageId) {
              $(this).removeClass('selected');
            }
          });
      }
    })

    // on successful image select response, send request to update adwords
    .on('ajax:success', '#adwords-image-select-form', function (event) {

      $.ajax({
        url: '/stories/' + $(this).data('story-id') + '/adwords',
        method: 'put',
        data: { image_changed: true },
        dataType: 'script'
      });

    })

    // reset the modal
    .on('hidden.bs.modal', '#ad-image-select-modal', function () {
      $(this).find('.modal-footer').empty();
      $(this).find('.thumbnail').removeClass('selected');
      $(this).find('li').removeClass('hidden');
      $(this).find('button[type="submit"]').prop('disabled', true);
    });


}