
function promote () {

}

function promoteListeners () {

  $(document)
    // manually hide the tooltip when navigating away (since it has container: body)
    .on('mouseout', '#promote-settings-tab-pane',
      function () {
        $('[data-toggle="tooltip"]').tooltip('hide');
      })

    // change sponsored story status
    .on('click', 'td.status-dropdown .dropdown-menu a.pause, td.status-dropdown .dropdown-menu a.enable',
      function () {
        var storyId = $(this).closest('tr').data('story-id');

        $(this).closest('.dropdown')
               .find('a.dropdown-toggle')
               .toggleClass('enabled paused')
               .children(':first')
               .toggleClass('fa-play fa-pause');
        $(this).closest('.dropdown-menu').children('li').toggle();

        // first update story.adwords_config and return positive json response,
        // then send a request to update adwords
        $.ajax({
          url: '/stories/' + storyId + '/adwords_config',
          method: 'put',
          data: {
            adwords_config: {
              enabled: $(this).attr('class') === 'enable' ? true : false,
            }
          },
          dataType: 'json',
          success: function (data, status, xhr) {
            $.get({
              url: '/adwords/update/' + storyId,
              data: { status_changed: true },
              dataType: 'script'
            });
          },
        });

      })

    // on clicking a sponsored story thumbnail,
    // open the image select modal and create the story form
    .on('click', 'td.sponsored-story-image .thumbnail',
      function () {
        var $modal = $('#adwords-image-select-modal'),
            storyId = $(this).closest('tr').data('story-id'),
            currentImageUrl = $(this).children('img').attr('src'),
            template = _.template( $('#adwords-image-select-form-template').html() );

        // remove any query param that was used to refresh an image
        currentImageUrl = currentImageUrl.slice(0, currentImageUrl.lastIndexOf('?'));

        // unhide any images that were hidden last time
        $modal.find('li').removeClass('hidden');
        // hide the current image
        $modal.find('img[src="' + currentImageUrl + '"]')
              .closest('li').addClass('hidden');
        // add the form
        $modal.find('.modal-footer').empty()
              .append( template({ storyId: storyId }) );
        $modal.modal('show');
      })

    // on successful image select response, send request to update adwords
    // see x_editable.js for request following long_headline update
    .on('ajax:success', '#adwords-image-select-form',
      function (event) {
        $.get({
          url: '/adwords/update/' + $(this).data('story-id'),
          data: { image_changed: true },
          dataType: 'script'
        });
      })

    // on selecting an image, update a hidden field containing the selected image id
    .on('click', '#adwords-image-select-modal .thumbnail',
      function () {
        if ($(this).hasClass('selected')) {
          return false;
        } else {
          var selectedImageId = $(this).data('image-id');
          $(this).addClass('selected');
          // update the form's hidden field for image id
          $(this).closest('.modal-content').find('input[type="hidden"]')
                 .val(selectedImageId);
          $('#adwords-image-select-modal .thumbnail')
            // thumbnail is the raw html, $(this) is jquery
            .each(function (index, thumbnail) {
              if ($(this).data('image-id') !== selectedImageId) {
                $(this).removeClass('selected');
              }
            });
        }
      })

    // reset the modal
    .on('hidden.bs.modal', '#adwords-image-select-modal',
      function () {
        $(this).find('.modal-footer').empty();
        $(this).find('.thumbnail').removeClass('selected');
      })

    // ad previews - separate window
    .on('click', '.preview-window a',
      function () {
        var storyId = $(this).closest('tr').data('story-id');
        window.open('/stories/' + storyId +
                    '/sponsored_story_preview', '_blank');
      })

    // upload a new default adwords image
    .on('change.bs.fileinput', '.adwords-default.adwords')
    // upload a new adwords image
    .on('click', 'button.new-adwords-image',
      function () {

        var $imagesList = $('ul.adwords-images'),
            template = _.template( $('#adwords-image-template').html() );

        $imagesList.append( template({ image_index: $imagesList.find('li').length }) );

        initS3Upload(); // init S3 for dynamically added file input

        $('li.new-adwords-image input[type="file"]')[0].click();

      })

    // on additional image uploaded
    .on('change.bs.fileinput', 'li.new-adwords-image',
      function () {
        var imageUrl = $(this).find('.fileinput-preview.thumbnail').attr('src');
        $(this)
          .removeClass('hidden new-adwords-image')
          .find('input[type="file"]').addClass('hidden');  // doesn't work if the input has class: hidden from the get-go
      })

    .on('click', '.adwords-default .change-image',
      function () {
        var $previewImg = $(this).closest('.fileinput').children('.fileinput-preview img');
        if ($previewImg.attr('src')) {
          // click on the preview
          $(this).closest('.fileinput').children('.thumbnail')[1].click();
        } else {
          // click on the placeholder
          $(this).closest('.fileinput').children('.thumbnail')[0].click();
        }
      })

    // make default checkboxes are mutually exclusive
    .on('change', 'li.adwords-image input[name*="company_default"]',
      function () {
        var $checkbox = $(this),
            $allCheckboxes = $('li.adwords-image input[name*="company_default"]');
        // uncheck other images
        $allCheckboxes.each(function () {
          if ($(this).is($checkbox)) { // do nothing
          } else { $(this).prop('checked', false); }
        });
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











