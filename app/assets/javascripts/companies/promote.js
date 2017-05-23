
// function executes when promote tab is clicked on
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

    // on clicking a sponsored story thumbnail,
    // open the image select modal and create the story form
    .on('click', 'td.sponsored-story-image .thumbnail',
      function () {
        // if <= 1, there is no alterative to the current image
        if ( $('#adwords-image-select-modal li').length <= 1 ) {
          return false;
        }
        var $modal = $('#adwords-image-select-modal'),
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

    // on successful image select response, send request to update adwords
    // see x_editable.js for request following long_headline update
    .on('ajax:success', '#adwords-image-select-form',
      function (event) {
        $.ajax({
          url: '/stories/' + $(this).data('story-id') + '/adwords',
          method: 'put',
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
          var selectedImageId = $(this).closest('li').data('image-id');
          $(this).closest('.modal-content')
                 .find('button[type="submit"]').prop('disabled', false);
          $(this).addClass('selected');
          // update the form's hidden field for image id
          $(this).closest('.modal-content').find('.modal-footer input[type="hidden"]')
                 .val(selectedImageId);
          $('#adwords-image-select-modal .thumbnail')
            // thumbnail is the raw html, $(this) is jquery
            .each(function (index, thumbnail) {
              if ($(this).closest('li').data('image-id') !== selectedImageId) {
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
        $(this).find('li').removeClass('hidden');
        $(this).find('button[type="submit"]').prop('disabled', true);
      })

    // ad previews - separate window
    .on('click', '.preview-window a',
      function () {
        var storyId = $(this).closest('tr').data('story-id');
        window.open('/stories/' + storyId +
                    '/sponsored_story_preview', '_blank');
      })

    // upload a new adwords image
    .on('click', 'button.new-adwords-image',
      function () {

        var $imagesList = $('ul.adwords-images'),
            template = _.template( $('#adwords-image-template').html() );

        $imagesList.append( template({ image_index: $imagesList.find('li').length }) );

        initS3Upload(); // init S3 for dynamically added file input

        $('li.new-adwords-image input[type="file"]')[0].click();

      })

    // when this event triggers (image upload), the image dimensons won't be ready
    // if the validation is performed immediately
    // $('img').on('load', ...) not working, probably because image is stored as data:
    // so check the .complete property of the img element
    .on('change.bs.fileinput', '.adwords-default.adwords-image, .adwords-default.adwords-logo',
      function () {
        var $_this = $(this),
            waitForImage,  // this will be a window timer id, need to declare in case it's never created
            imgLoaded = function () {
              if ($_this.find('.fileinput-exists img')[0].complete) {
                window.clearTimeout(waitForImage);
                $('#promote-settings-form').validator('validate');
              }
              else {
                return 'false';
              }
            };
        if ( imgLoaded() === 'false' ) {
          waitForImage = window.setTimeout(imgLoaded, 100);
        }
      })

    // on additional image uploaded
    .on('change.bs.fileinput', 'li.new-adwords-image',
      function () {
        var $newImage = $(this),
            img = $(this).find('img')[0],
            meetsSizeRequirements = function (img) {
              var minWidth = 600, minHeight = 314,
                  ratio = img.naturalWidth / img.naturalHeight;
              if ( img.naturalWidth < minWidth ||
                   img.naturalHeight < minHeight ||
                   ratio < 1.8909 || ratio > 1.929 ) {
                return false;
              } else { return true; }
            },
            waitForImage,  // this will be a window timer id, need to declare in case it's never created
            imgLoaded = function () {
              if (img.complete) {
                window.clearTimeout(waitForImage);
                if ( meetsSizeRequirements(img) ) {
                  $newImage
                    .removeClass('hidden new-adwords-image')
                    .find('input[type="file"]').addClass('hidden');  // doesn't work if the input has class: hidden from the get-go
                } else {
                  $newImage.remove();
                  flashDisplay("Image doesn't meet size requirements", 'danger');
                }
              }
              else {
                return 'false';
              }
            };

        if ( imgLoaded() == 'false' ) {
          waitForImage = window.setTimeout(imgLoaded, 100);
        }
      })

    .on('click', '.adwords-default .change-image',
      function () {
        var $previewImg = $(this).closest('.fileinput').find('.fileinput-preview img');
        if ($previewImg.attr('src')) {
          // click on the preview
          $(this).closest('.fileinput').find('.thumbnail')[1].click();
        } else {
          // click on the placeholder
          $(this).closest('.fileinput').find('.thumbnail')[0].click();
        }
      })

    // make default are mutually exclusive
    .on('change', 'li.adwords-image input[name*="company_default"]',
      function () {
        var $checkbox = $(this),
            // $selectedImage = $(this).closest('li.adwords-image'),
            // selectedImageId = $selectedImage.next().val(),
            $allCheckboxes = $('li.adwords-image input[name*="company_default"]'),
            defaultImageId = null;
        // uncheck other images
        $allCheckboxes.each(function () {
          if ($(this).is($checkbox)) {
            // do nothing
          } else {
            $(this).prop('checked', false);
            // if this is the current default, swap id with the selected new default
            // if ($(this).closest('.li.adwords-image').hasClass('hidden')) {
            //   $(this).closest('.li.adwords-image').next().val()
            // }

          }


        });

      })

    .on('click', 'li.adwords-image .remove-image, li.adwords-image .cancel-remove-image',
      function () {
        var $li = $(this).closest('.adwords-image'),
            $liControlTop = $li.find('.adwords-image-form-control-top'),
            $liControlBottom = $li.find('.adwords-image-form-control-bottom'),
            $destroyInput = $li.find(':checkbox.hidden');

        if ($(this).hasClass('remove-image')) {
          $li.addClass('to-be-removed');
          $destroyInput.prop('checked', true);
          $liControlBottom
             .html('<span>Save changes below or <a class="cancel-remove-image">Cancel</a></span>');

        } else {  // .cancel-remove-image
          $li.removeClass('to-be-removed');
          $destroyInput.prop('checked', false);
          $liControlBottom.html('');
        }

      })

    .on('click', 'li.adwords-image .cancel-add-image',
      function () {
        var $list = $('ul.adwords-images li'),
            $selectedImage = $(this).closest('li'),
            selectedImageIndex = parseInt($selectedImage.find('input[type="file"]')
                                     .attr('name').match(/\]\[(\d+)\]\[/)[1], 10);

        // any images following the one that's removed?
        if ($selectedImage.next().length) {
          // find and decrement index that appears in name and id attributes
          // of various inputs (for all following images)
          $list
            .slice(selectedImageIndex + 1)
            .each(function () {
              // we need to modify true and false checkbox inputs separately,
              // because false doesn't have an id attribute
              var $checkboxInputTrue = $(this).find('input[name*="company_default"][value="true"]'),
                  $checkboxInputFalse = $(this).find('input[name*="company_default"][value="false"]'),
                  $fileInput = $(this).find('input[type="file"]');

              $checkboxInputTrue.attr({
                id: $checkboxInputTrue.attr('id')
                      .replace(/_(\d+)_/, function (match, index) {
                        return '_' + (parseInt(index,10) - 1).toString() + '_';
                      }),
                name: $checkboxInputTrue.attr('name')
                        .replace(/\]\[(\d+)\]\[/, function (match, index) {
                          return '][' + (parseInt(index,10) - 1).toString() + '][';
                        })
              });
              $checkboxInputFalse.attr({
                name: $checkboxInputFalse.attr('name')
                        .replace(/\]\[(\d+)\]\[/, function (match, index) {
                          return '][' + (parseInt(index,10) - 1).toString() + '][';
                        })
              });
              $fileInput.attr({
                id: $fileInput.attr('id')
                      .replace(/_(\d+)_/, function (match, index) {
                        return '_' + (parseInt(index,10) - 1).toString() + '_';
                      }),
                name: $fileInput.attr('name')
                        .replace(/\]\[(\d+)\]\[/, function (match, index) {
                          return '][' + (parseInt(index,10) - 1).toString() + '][';
                        })
              });
            });
          // remove hidden inputs that contain the image_urls
          $('input[type="hidden"][name*="image_url"]')
            .slice((selectedImageIndex - $list.not('.to-be-added').length) + 1)
            .each(function () {
              $(this).attr({
                name: $(this).attr('name')
                        .replace(/\]\[(\d+)\]\[/, function (match, index) {
                          return '][' + (parseInt(index,10) - 1).toString() + '][';
                      })
              });
            });
        }
        // remove the image from the list
        $selectedImage.remove();
        // remove the first match because we've already adjused indices,
        // so the first encountered match will be the image that was removed;
        // the second match we want to keep
        $('input[type="hidden"][name*="][' + selectedImageIndex.toString() + '][image_url]"]')
          .first().remove();
      })

    // in progress icon on submit button
    .on('submit', '#promote-settings-form, #adwords-image-select-form, #adwords-sync-form',
      function () {
        if (!$(this).find('button[type="submit"]').prop('disabled')) {
          $(this).find('.submit-toggle').toggle();
        }
      });

}











