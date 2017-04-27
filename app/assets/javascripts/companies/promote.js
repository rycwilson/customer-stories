
function promote () {

}

function promoteListeners () {

  $(document)
    // manually hide the tooltip when navigating away (since it has container: body)
    .on('mouseout', '#promote-settings-tab-pane',
      function () {
        $('[data-toggle="tooltip"]').tooltip('hide');
      })

    // on clicking a sponsored story thumbnail,
    // open the image select modal and create the story form
    .on('click', 'td.sponsored-story-image .thumbnail',
      function () {
        var $modal = $('#image-select-modal'),
            storyId = $(this).closest('tr').data('story-id'),
            template = _.template( $('#image-select-form-template').html() );
        $modal.find('.modal-footer').empty()
              .append(template({ storyId: storyId }));
        $modal.modal('show');
      })

    .on('click', '#image-select-modal .thumbnail',
      function () {
        if ($(this).hasClass('selected')) {
          return false;
        } else {
          var selectedImageId = $(this).data('image-id');
          $(this).addClass('selected');
          // update the form's hidden field for image id
          $(this).closest('.modal-content').find('input[type="hidden"]')
                 .val(selectedImageId);
          $('#image-select-modal .thumbnail')
            // thumbnail is the raw html, $(this) is jquery
            .each(function (index, thumbnail) {
              if ($(this).data('image-id') !== selectedImageId) {
                $(this).removeClass('selected');
              }
            });
        }
      })

    // ad previews - separate window
    .on('click', '.preview-window a',
      function () {
        var storyId = $(this).closest('tr').data('story-id');
        window.open('/stories/' + storyId +
                    '/sponsored_story_preview', '_blank');
      })

    .on('click', 'button.new-adwords-image',
      function () {

        var $imagesList = $('ul.adwords-images'),
            template = _.template( $('#adwords-image-template').html() );

        $imagesList.append( template({ image_index: $imagesList.find('li').length }) );

        initS3Upload(); // init S3 for dynamically added file input

        $('li.new-adwords-image input[type="file"]')[0].click();

      })

    .on('change.bs.fileinput', 'li.new-adwords-image',
      function () {
        $(this)
          .removeClass('hidden new-adwords-image')
          .find('input[type="file"]').addClass('hidden');  // doesn't work if the input has class: hidden from the get-go
      })

    .on('click', 'li.adwords-image .change-image',
      function () {
        $(this).closest('.fileinput').children('.thumbnail')[0].click();
      })

    .on('click', 'li.adwords-image .remove-image',
      function () {
        $(this).closest('.fileinput')
               .children('.thumbnail')
               .toggleClass('to-be-removed');
        var $destroy = $(this).closest('.fileinput').find(':checkbox');
        $destroy.prop('checked', !$destroy.prop('checked'));
      });

}











