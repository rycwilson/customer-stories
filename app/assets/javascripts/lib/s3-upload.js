// need to validate input file name
// http://stackoverflow.com/questions/22387874/jquery-validate-plugin-bootstrap-jasny-bootstrap-file-input-regex-validation
function initS3Upload () {
  $('.directUpload').find("input:file").each(function () {
    var $fileInput = $(this),
        $form = $fileInput.closest('form'),
        $submitBtn = $form.find('input[type="submit"]').length ?
                       $form.find('input[type="submit"]') :
                       $('button[type="submit"][form="' + $form.attr('id') + '"]');

    /**
     *  summernote's native file input seems to be ignored when selecting a file, so a buffer
     *  is used instead. When drag-dropping, the file gets uploaded multiple times - see note below
     */
    if ($(this).is('.note-image-input')) return false;

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
        if ($(this).is('#narrative__img-upload') && $(this).fileupload('active')) {
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
          flashDisplay('File name can not contain spaces', 'danger');
          $('.fileinput').fileinput('reset');  // jasny bootstrap
          return false;
        }
      },
      start: function (e) {
        // console.log('s3 start')
        $submitBtn.prop('disabled', true);
      },
      done: function(e, data) {
        // console.log('s3 done')
        $submitBtn.prop('disabled', false);

        // extract key and generate URL from response
        var key = $(data.jqXHR.responseXML).find("Key").text(),
            url = 'https://' + $form.data('host') + '/' + key;
        if ($(this).is('#narrative__img-upload')) {
          $('#narrative-editor').summernote(
            'pasteHTML',
            '<img src="' + url + '" alt="story image" style="max-width: 100%">'
          );

          // if the input buffer's value isn't set to blank, it will force a request with data-type=html
          $('#narrative__img-upload').val('');
        } else {
          // if the input buffer's value isn't set to blank, it will force a request with data-type=html
          $(this).val('');

          // create hidden field
          var $hiddenInput = $("<input />", { type:'hidden', name: $fileInput.attr('name'), value: url });
          $form.append($hiddenInput);
        }
        $submitBtn.prop('disabled', false);
      },
      fail: function(e, data) {
        // console.log('s3 fail')
        $submitBtn.prop('disabled', false);
      }
    });

  });
}