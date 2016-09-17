
// need to vlidate input file name
// http://stackoverflow.com/questions/22387874/jquery-validate-plugin-bootstrap-jasny-bootstrap-file-input-regex-validation
function initS3Upload () {

  $('.directUpload').find("input:file").each(function (i, elem) {
    var fileInput    = $(elem);
    var form         = $(fileInput.parents('form:first'));
    var submitButton = form.find('input[type="submit"]');
    var progressBar  = $("<div class='bar'></div>");
    var barContainer = $("<div class='progress'></div>").append(progressBar);
    // fileInput.after(barContainer);
    fileInput.fileupload({
      fileInput:       fileInput,
      url:             form.data('url'),
      type:            'POST',
      autoUpload:       true,
      formData:         form.data('form-data'),
      paramName:        'file', // S3 does not like nested name fields i.e. name="user[avatar_url]"
      dataType:         'XML',  // S3 returns XML if success_action_status is set to 201
      replaceFileInput: false,
      progressall: function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        progressBar.css('width', progress + '%');
      },
      submit: function (e, data) {
        /*
         *  don't allow spaces in file names
         *  note: this is dependent upon bootstrap jasny hack,
         *  ref: https://github.com/jasny/bootstrap/issues/179
         */
        var filePath = $(e.target).val(),
            fileName = filePath.slice(filePath.lastIndexOf('/') + 1, filePath.length);
        if (fileName.indexOf(' ') !== -1) {
          flashDisplay('File name can not contain spaces', 'danger');
          $('.fileinput').fileinput('reset');
          return false;
        }
      },
      start: function (e) {
        submitButton.prop('disabled', true);
        progressBar.
          css('background', 'green').
          css('display', 'block').
          css('width', '0%').
          text("Loading...");
      },
      done: function(e, data) {
        submitButton.prop('disabled', false);
        progressBar.text("Uploading done");
        // extract key and generate URL from response
        var key   = $(data.jqXHR.responseXML).find("Key").text();
        var url   = 'https://' + form.data('host') + '/' + key;

        // create hidden field
        var input = $("<input />", { type:'hidden', name: fileInput.attr('name'), value: url });
        form.append(input);
        if (form.prop('id') === 'customer-logo-form') {
          $.ajax({
            url: form.attr('action'),
            method: 'put',
            data: form.serialize(),
            success: function (data, status) {
              console.log(data, status);
            }
          });
        }
      },
      fail: function(e, data) {
        submitButton.prop('disabled', false);

        progressBar.
          css("background", "red").
          text("Failed");
      }
    });
  });
}