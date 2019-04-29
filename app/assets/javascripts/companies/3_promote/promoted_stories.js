
function promotedStoriesListeners () {

  $(document)

    // story image select
    .on('click', 'td.promoted-story-image .thumbnail', function () {
      var $modal = $('#ads-images-modal'),
          $tr = $(this).closest('tr'),
          storyId = $tr.data('story-id'),
          adsImages = $('#promoted-stories-table').DataTable().row($tr).data().ads_images,
          currentImageUrl = $(this).children('img').attr('src'),
          formTemplate = _.template( $('#ads-images-form-template').html() );
  console.log('adsImages', adsImages)
      // remove any query param that was used to refresh an image
      if (currentImageUrl.match(/\?\d+/)) {
        currentImageUrl = currentImageUrl.slice(0, currentImageUrl.lastIndexOf('?'));
      }

      $modal.find('.modal-header .story-title')
              .text($tr.find('td.promoted-story-title').text())
              .end()
            .find('li')
              .each(function (adImage) {
                var imageId = $(this).data('image-id');
                if (adsImages.find(function (ad_image) { return ad_image.id === imageId; })) {
                  $(this).addClass('selected');
                }
              })
              .end()
            .find('.modal-footer')
              .empty()
              .append(formTemplate({ storyId: storyId }))
              .end()
            .find('#ads-images-form input[name="ads_images_ids[]"]')
              .val(_.pluck(adsImages, 'id'));

      $modal.modal('show');


    })

    .on('hidden.bs.modal', '#ads-images-modal', function () {
      $(this).find('li').removeClass('selected');
    })

    // on selecting an image, update a hidden field containing the selected image id
    .on('click', '#ads-images-modal li', function () {
      $(this).toggleClass('selected')
      // if ($(this).hasClass('selected')) {
      //   return false;
      // } else {
      //   var selectedImageId = $(this).closest('li').data('image-id');
      //   $(this).closest('.modal-content')
      //          .find('button[type="submit"]').prop('disabled', false);
      //   $(this).addClass('selected');
      //   // update the form's hidden field for image id
      //   $(this).closest('.modal-content').find('.modal-footer input[type="hidden"]')
      //          .val(selectedImageId);
      //   $('#ads-images-modal .thumbnail')
      //     // thumbnail is the raw html, $(this) is jquery
      //     .each(function (index, thumbnail) {
      //       if ($(this).closest('li').data('image-id') !== selectedImageId) {
      //         $(this).removeClass('selected');
      //       }
      //     });
      // }
    })

    // on successful image select response, send request to update adwords
    .on('ajax:success', '#ads-images-form', function (event) {
      $('#ads-images-modal').modal('hide')

      // $.ajax({
      //   url: '/stories/' + $(this).data('story-id') + '/adwords',
      //   method: 'put',
      //   data: { image_changed: true },
      //   dataType: 'script'
      // });

    })

    // reset the modal
    .on('hidden.bs.modal', '#ads-images-modal', function () {
      $(this).find('.modal-footer').empty();
      $(this).find('.thumbnail').removeClass('selected');
      $(this).find('li').removeClass('hidden');
      $(this).find('button[type="submit"]').prop('disabled', true);
    })

    // change long headline
    .on('click', 'td.promoted-story-title', function () {
      var $row = $(this).parent();
      openPromotedStoriesEditor(promotedStoriesEditor, $row);
    })

    // change status
    .on('click', 'td.status.dropdown .dropdown-menu a.pause, ' +
                 'td.status.dropdown .dropdown-menu a.enable', function () {
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
      var dt = $('#promoted-stories-table').DataTable(),
          story = dt.row($(this).closest('tr')).data();
      window.open(
        '/promote/preview/' + story.slug, '_blank'
      );
    });

}