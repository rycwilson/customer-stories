// need to validate input file name
// http://stackoverflow.com/questions/22387874/jquery-validate-plugin-bootstrap-jasny-bootstrap-file-input-regex-validation
function initS3Upload($form, $input) {
  // console.log('initS3Upload()...', $form, $input)

  const initInput = ($fileInput, formData) => {
    const $formGroup = $fileInput.closest('.form-group');
    $fileInput.fileupload({
      fileInput: $fileInput,
      type: 'POST',
      url: formData.url,
      autoUpload: true,
      formData: formData.formData,
      paramName: 'file',  // S3 does not like nested name fields i.e. name="user[avatar_url]"
      dataType: 'XML',    // S3 returns XML if success_action_status is set to 201
      replaceFileInput: false,
      progressall: (e, data) => {
        // var progress = parseInt(data.loaded / data.total * 100, 10);
      },
      submit: (e, data) => {
        console.info('s3 submit...') 
        /*
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
        *  note this is dependent upon bootstrap jasny hack,
        *  ref https://github.com/jasny/bootstrap/issues/179
        */
        const filePath = $(e.target).val();
        const fileName = filePath.slice(filePath.lastIndexOf('/') + 1, filePath.length);
        if (fileName.indexOf(' ') !== -1) {
          if ($fileInput.is('[name*="images_attributes"]')) {
            $formGroup
              .addClass('has-error')
              .find('.help-block.with-errors')
              .text('Spaces in file name not allowed');
          } else if ($('#customer-form').has($fileInput).length) {
            $('.customer-logo__header').addClass('has-error');
            setTimeout(() => $('.customer-logo__header').removeClass('has-error'), 3000);
          } else {
            flashDisplay('File name can not contain spaces', 'danger');
          }

          // TODO: this is reverting back to the placeholder instead of the existing image
          $fileInput.closest('.fileinput').fileinput('reset');  // jasny bootstrap
          return false;
        }
      },
      start: (e) => {
        console.log('s3 start...')
      },
      done: (e, data) => {
        console.log('s3 done...')
        const key = $(data.jqXHR.responseXML).find('Key').text();
        const url = `https://${formData.host}/${key}`;
        let $imageUrlInput;

        /*
        * find the image_url input, may be different for:
        * - company logo
        * - customer logo
        * - summernote image
        * - promote image
        */

        // promote images
        if ($fileInput.is('[name*="images_attributes"]')) {
          // the hidden image_url input isn't inside the form-group lest jasny js screw with it
          $imageUrlInput = $formGroup.prevAll('input[name*="[image_url]"]');
        }

        // summernote
        if ($fileInput.is('#narrative__img-upload')) {
          $('#narrative-editor').summernote(
            'pasteHTML',
            `<img src="${url}" alt="story image" style="max-width: 100%">`
          );

        } else {
          // note the image is being uploaded to s3 even if there's a validation error (autoupload)
          if ($formGroup.hasClass('has-error')) {
            // console.log('error')
          } else {
            if ($imageUrlInput) {
              $imageUrlInput.val(url);
            } else {
              $imageUrlInput = $('<input>', { type:'hidden', name: $fileInput.attr('name'), value: url });
              $formGroup.append($imageUrlInput);
            }
          }
        }

        // if the input buffer's value isn't set to blank, it will force a request with data-type=html

        $fileInput.val('');
      },
      fail: (e, data) => {
        // possible to get a 403 Forbidden error
        // console.log('s3 fail')
      }
    });
  };

  if ($form && $input) {
    initInput($input, $form.data());
  } else if ($form) {
    $form.find("input:file").each((i, input) => initInput($(input), $form.data()));
  } else {
    $('form.directUpload:not(#gads-form)').each((i, form) => {
      const formData = $(form).data();
      $(form).find("input:file").each((j, input) => {
        /**
         *  summernote's native file input seems to be ignored when selecting a file, so a buffer
         *  is used instead. When drag-dropping, the file gets uploaded multiple times - see note below
         */
        if ($(input).is('.note-image-input')) return false;
        initInput($(input), formData);
      });
    });
  }
}