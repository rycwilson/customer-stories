
// need to validate input file name
// http://stackoverflow.com/questions/22387874/jquery-validate-plugin-bootstrap-jasny-bootstrap-file-input-regex-validation
function initS3Upload ($form) {
  // console.log('initS3Upload()')
  // return false;

  var initForm = function ($form) {
    $form.find('input:file').each(function () {
      var $fileInput = $(this),
          $formGroup = $fileInput.closest('.form-group');
          // $formGroup = $fileInput.closest('.form-group.fileinput');

      $fileInput.fileupload({
        fileInput: $fileInput,
        url: $form.data('url'),
        type: 'POST',
        autoUpload: true,
        formData: $form.data('form-data'),
        paramName: 'file', // S3 does not like nested name fields i.e. name="user[avatar_url]"
        dataType: 'XML',  // S3 returns XML if success_action_status is set to 201
        replaceFileInput: false,
        progressall: function (e, data) {
          // var progress = parseInt(data.loaded / data.total * 100, 10);
        },
        submit: function (e, data) {
          // console.log('s3 submit') 
          /**
           *  When drag-dropping an image into summernote editor, the image gets uploaded twice, see:
           *    https://stackoverflow.com/questions/41768242
           *  The .fileupload('active') method will return the number of active uploads
           *  => don't start another upload if one is already active
           */
          if ($fileInput.is('#narrative__img-upload') && $fileInput.fileupload('active')) {
            return false;
          }
          /*
           *  don't allow spaces in file names
           *  note: this is dependent upon bootstrap jasny hack,
           *  ref: https://github.com/jasny/bootstrap/issues/179
           */
          var filePath = $(e.target).val(),
              fileName = filePath.slice(filePath.lastIndexOf('/') + 1, filePath.length);
          if (fileName.indexOf(' ') !== -1) {
            if ($fileInput.is('[name*="images_attributes"]')) {
              $fileInput.closest('.form-group')
                        .addClass('has-error')
                        .find('.help-block.with-errors')
                        .text('Spaces in file name not allowed')
            } else if ($('#customer-form').has($fileInput).length) {
              $('.customer-logo__header').addClass('has-error');
              setTimeout(function () {
                $('.customer-logo__header').removeClass('has-error');
              }, 3000)
            } else {
              flashDisplay('File name can not contain spaces', 'danger');
            }

            // TODO: this is reverting back to the placeholder instead of the existing image
            $fileInput.closest('.fileinput').fileinput('reset');  // jasny bootstrap
            return false;
          }
        },
        start: function (e) {
          // console.log('s3 start')
        },
        done: function(e, data) {
          // console.log('s3 done')
          var key = $(data.jqXHR.responseXML).find('Key').text(),
              url = 'https://' + $form.data('host') + '/' + key,
              $imageUrlInput;

          // find the image_url input, may be different for:
          // - company logo
          // - customer logo
          // - summernote image
          // - promote image

          // promote images
          if ($fileInput.is('[name*="images_attributes"]')) {

            // the hidden image_url input isn't inside the form-group lest jasny js screw with it
            $imageUrlInput = $formGroup
                               .closest('.ad-image-card')
                               .find('input[name*="[image_url]"]:not([type="file"])');
          }

          if ($fileInput.is('#narrative__img-upload')) {
            $('#narrative-editor').summernote(
              'pasteHTML',
              '<img src="' + url + '" alt="story image" style="max-width: 100%">'
            );

          } else {
            // note the image is being uploaded to s3 even if there's a validation error (autoupload)
            if ($formGroup.is(':not(.has-error)')) {
              // console.log('writing url ', url)
              if ($imageUrlInput) {
                $imageUrlInput.val(url);

              } else {
                $imageUrlInput = $('<input>', { type:'hidden', name: $fileInput.attr('name'), value: url });
                $formGroup.append($imageUrlInput);
              }
            } else {
            }
          }

          // if the input buffer's value isn't set to blank, it will force a request with data-type=html
          $fileInput.val('');
        },
        fail: function(e, data) {
          // possible to get a 403 Forbidden error
          // console.log('s3 fail')
        }
      });
    })
  }

  /**
   *  initialize file inputs related to a form
   */
  if ($form) {
    initForm($form);

  } else {
    /**
     * initialize file inputs associated with all form.directUpload
     */
    $('form.directUpload').find("input:file").each(function () {
      var $fileInput = $(this),
          $form = $fileInput.closest('form.directUpload');

      /**
       *  summernote's native file input seems to be ignored when selecting a file, so a buffer
       *  is used instead. When drag-dropping, the file gets uploaded multiple times - see note below
       */
      if ($fileInput.is('.note-image-input')) return false;

      initForm($form);
    });
  }

}