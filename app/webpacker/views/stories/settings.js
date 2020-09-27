export default {
  init() {
    initSelectInputs();
    initSwitchInputs();
    storySettingsValidator();
    // initS3Upload
  },
  addListeners() {
    $(document)
      .on('click', '.og-image-upload__button', onImageUploadBtnClick)
      .on('change.bs.fileinput', '.og-image-upload .fileinput', onFileinputChange)
      .on('validate.bs.validator', '#story-settings-form', function () {
        // console.log('validate.bs.validator')
      })
  }
}

function onImageUploadBtnClick(e) {
  $(this).blur();
  const $existingImage = $('.og-image-upload__thumbnail.fileinput-exists img');
  const $newImage = $('.og-image-upload__thumbnail.fileinput-new img');
  $existingImage.attr('src') ? $existingImage.click() : $newImage.click();
  $('.og-image-upload').attr('data-ready-to-validate', '');
}

function onFileinputChange(e) {
  const $previewImage = $('.og-image-upload__thumbnail.fileinput-preview img');
  $('.og-image-upload').removeClass('has-error');
  $previewImage.css('visibility', 'hidden');  // validate first
  if (!imageIsNew($previewImage)) {
    checkForNewImage = setInterval(imageIsNew, 100, $previewImage);
  }
}

function validateImageSize($img, $fileinput) {
  // console.log('validating image size..')
  const width = $img[0].naturalWidth;
  const height = $img[0].naturalHeight; 
  const minWidth = $fileInput.data('min-dimensions').split('x')[0];
  const minHeight = $fileInput.data('min-dimensions').split('x')[1];
  const ratio = width / height;
  const isTooSmall = (width < minWidth || height < minHeight) ?
    'Image is wrong size' :
    false;
  const hasWrongAspectRatio = (ratio >= 1.8909 && ratio <= 1.929) ?
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

// bs validator will attempt to validate the image that existed prior to upload
// => check for new image before validating
function imageIsNew($img) {
  if ($img.attr('src') && $img.attr('src').includes('data:')) {
    clearInterval(checkForNewImage);
    if (!imageDidLoad($img)) {
      checkImageLoaded = setInterval(imageDidLoad, 100, $img);
    }
    return true;
  } else {
    // console.log('image is not new')
  }
}

function storySettingsValidator() {
  $('#story-settings-form').validator({
    focus: false,
    disable: false,
    custom: {
      'min-dimensions': ($fileInput) => {
        const $img = $('.og-image-upload__thumbnail.fileinput-preview img');

        // if uploading a new image over an existing one, validator will first try
        // to validate the existing image => ignore this
        if ($('.og-image-upload').attr('data-ready-to-validate')) {
          validateImageSize($img, $fileinput)
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

function initSelectInputs() {
  $('.story-settings.story-tags, #story-ctas-select')
    .select2({
      theme: 'bootstrap',
      placeholder: 'Select'
    })
    .on('select2:select, select2:unselect, change.select2', function () {
      $(this).next('.select2')
              .find('.select2-selection__choice__remove')
                .html('<i class="fa fa-fw fa-remove"></i>');
    })
    .trigger('change.select2');  // manipulate the remove button
}

function initSwitchInputs() {
  $('.bs-switch.publish-control').bootstrapSwitch({
    size: 'small',
    onInit: function (e) {}
  });
};