
function promoteSettingsListeners () {

  $(document)

    // upload a new adwords image
    .on('click', '.new-adwords-image-icon:not(.disabled)', function () {
      var $imagesList = $('ul.adwords-images');
      $imagesList.append(
        _.template($('#adwords-image-template').html())({
          imageIndex: $imagesList.find('li').length
        })
      );

      $('li.new-adwords-image input[type="file"]')[0].click();
    })

    // when this event triggers (image upload), the image dimensons won't be ready
    // if the validation is performed immediately
    // $('img').on('load', ...) not working, probably because image is stored as data:
    // so check the .complete property of the img element
    .on('change.bs.fileinput', '.adwords-default.adwords-logo, .adwords-default.adwords-image',
      function () {
        var $imgContainer = $(this),
            waitForImage,  // this will be a window timer id, need to declare in case it's never created
            imgLoaded = function () {
              if ($imgContainer.find('.fileinput-exists img')[0].complete) {
                window.clearTimeout(waitForImage);
                $('#promote-settings-form').validator('validate');
                return true;
              }
              else {
                return false;
              }
            };
        if (!imgLoaded()) {
          waitForImage = window.setTimeout(imgLoaded, 100);
        }
      })

    // on additional image uploaded
    .on('change.bs.fileinput', 'li.new-adwords-image',  function () {
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
              if (meetsSizeRequirements(img)) {
                /**
                 * To avoid non-valid images from being uploaded (and s3 dropping an input into the DOM hosing up the works),
                 # only init S3 if size requirements are met. Pass data to skip validation and avoid infinite loop
                 * Alternatively, autoUpload in the S3 initializer could be set to false and the upload could be
                 * manually triggered, but it's not clear how to do this
                 * No danger of infinite loop, as trigger ing change != triggering change.bs.fileinput
                 *
                 */
                initS3Upload();
                $newImage.find('input[type="file"]').trigger('change');
                $newImage
                  .removeClass('hidden new-adwords-image')
                  .find('input[type="file"]').addClass('hidden');  // doesn't work if the input has class: hidden from the get-go
              } else {
                $newImage.remove();
                flashDisplay("Image doesn't meet size requirements", 'danger');
              }
              return true;
            }
            else {
              return false;
            }
          };
      if (!imgLoaded()) {
        waitForImage = window.setTimeout(imgLoaded, 100);
      }
    })

    .on('click', '.adwords-default .change-image', function () {
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
    .on('change', 'li.adwords-image input[name*="company_default"]', function () {
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

    .on('click', 'li.adwords-image .remove-image, ' +
                 'li.adwords-image .cancel-remove-image', function () {
      var $li = $(this).closest('.adwords-image'),
          $liControlTop = $li.find('.adwords-image-form-control-top'),
          $liControlBottom = $li.find('.adwords-image-form-control-bottom'),
          $destroyImage = $li.find(':checkbox.hidden');

      if ($(this).hasClass('remove-image')) {
        $li.addClass('to-be-removed');
        $destroyImage.prop('checked', true);
        $liControlBottom
           .html('<span>Save changes below or <a class="cancel-remove-image">Cancel</a></span>');
      } else {  // .cancel-remove-image
        $li.removeClass('to-be-removed');
        $destroyImage.prop('checked', false);
        $liControlBottom.html('');
      }
    })

    .on('click', 'li.adwords-image .cancel-add-image', function () {
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
      function (e) {
        if ($(this).find('button[type="submit"]').hasClass('disabled')) {
          e.preventDefault();
        } else {
        }
      });
}