function initStorySettingsValidator () {

  const imageHasPersisted = (img) => img.src.includes('http');

  const validateImageDimensions = ($fileInput) => {
    // console.log('validating image dimensions...')
    const img = $fileInput[0].closest('.form-group').querySelector('img');
    
    // only want to validate new images => a url indicates an existing image
    if (imageHasPersisted(img)) return false;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const minWidth = $fileInput.data('min-dimensions').split('x')[0];
    const minHeight = $fileInput.data('min-dimensions').split('x')[1];
    const ratio = width / height;
    const isTooSmall = (width < minWidth || height < minHeight);
    const hasWrongAspectRatio = (ratio < 1.8909 || ratio > 1.929);
    if (isTooSmall || hasWrongAspectRatio) {
      // console.log('image is wrong size')
      img.remove();

      // TODO: don't upload until validated, or until validated AND form submitted
      // => see adwords images for example
      return 'Image is wrong size';
    } else {
      document.querySelector('[name="story[og_image_width]"]').value = width;
      document.querySelector('[name="story[og_image_height]"]').value = height;
      img.style.visibility = 'visible'
    }
  }

  $('#story-settings-form').validator({
    focus: false,
    disable: false,
    custom: {
      'min-dimensions': validateImageDimensions,
     
      // TODO: add this, also supported file formats
      // 'max-file-size': function ($fileInput) {
      //   // if uploading a new image over an existing one, validator will first try
      //   // to validate the existing image => ignore this
      //   var $img = $('.og-image__thumbnail.fileinput-preview img');
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