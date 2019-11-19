
function initStorySettingsValidator () {

  $('#story-settings-form').validator({
    focus: false,
    disable: false,
    custom: {
      'min-dimensions': function ($fileInput) {
        // console.log('story validator...')
        // if uploading a new image over an existing one, validator will first try
        // to validate the existing image => ignore this
        var $img = $('.og-image-upload__thumbnail.fileinput-preview img');
        if ($('.og-image-upload').attr('data-ready-to-validate')) {
          // console.log('validating image size...')
          // console.log('validating dimensions...')
          var width = $img[0].naturalWidth;
          var height = $img[0].naturalHeight; 
          var minWidth = $fileInput.data('min-dimensions').split('x')[0];
          var minHeight = $fileInput.data('min-dimensions').split('x')[1];
          var ratio = width / height;
          var isTooSmall = (width < minWidth || height < minHeight) ?
            'Image is wrong size' :
            false;
          var hasWrongAspectRatio = (ratio >= 1.8909 && ratio <= 1.929) ?
              false :
              'Image is wrong size';
          if (isTooSmall || hasWrongAspectRatio) {
            // console.log('image is wrong size')
            $img.remove();
            return isTooSmall || hasWrongAspectRatio;
          } else {
            // console.log('image size ok!')
            $('[name="story[og_image_width]"]').val(width);
            $('[name="story[og_image_height]"]').val(height);
            $img.css('visibility', 'visible');
          }
        }
      },

      // TODO: add this, also supported file formats
      // 'max-file-size': function ($fileInput) {
      //   // if uploading a new image over an existing one, validator will first try
      //   // to validate the existing image => ignore this
      //   var $img = $('.og-image-upload__thumbnail.fileinput-preview img');
      //   var noImagePresent = $img.attr('src') === undefined;
      //   var existingImagePresent = !noImagePresent && $img.attr('src').includes('http');
      //   if (noImagePresent || existingImagePresent) return false;
      //   console.log('validating file size...')
      //   if ($fileInput[0].files[0].size > $fileInput.data('max-file-size')) {
      //     return 'Image file is too big';
      //   } else {
      //     console.log('Image file size ok!')
      //     return undefined;
      //   }
      // }
      
    }
  })
}