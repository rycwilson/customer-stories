// MVP plug-ins
//= require slimscroll/jquery.slimscroll
//= require magnific-popup/dist/jquery.magnific-popup
//= require datatables/media/js/jquery.dataTables
//= require datatables-plugins/integration/bootstrap/3/dataTables.bootstrap
//= require bootstrap-jasny/js/fileinput.js
//= require mvpready-admin

// Select2
//= require select2/dist/js/select2

// AWS S3 upload
//= require jquery-ui/ui/widget.js
//= require jquery-file-upload/js/jquery.fileupload

$(function () {

  var lastProfileTab = sessionStorage.getItem('lastProfileTab');

  if (lastProfileTab) {
    $('[href="' + lastProfileTab + '"]').tab('show');
  }
  if (lastProfileTab) {
    $('[href="' + lastProfileTab + '"]').tab('show');
  }

  initListeners();
  configS3Upload();

});

function initListeners () {

  $('.nav-stacked a[data-toggle="tab"]').on('shown.bs.tab', function () {
    // password reload should go back to profile
    if ($(this).attr('href') == '#password-tab')
      sessionStorage.setItem('lastProfileTab', '#profile-tab');
    else
      sessionStorage.setItem('lastProfileTab', $(this).attr('href'));
  });

  $('.linkedin-checkbox').on('change', function () {

    if ($(this).val() === 'true') {
      $(this).val(false);
    } else {
      $(this).val(true);
    }

    $.ajax({
      url: '/contributions/' + $(this).data('token'),
      method: 'put',
      data: { "linkedin_include_profile": $(this).val() },
      success: function (data, status, xhr) {
        console.log(data, status);
      }
    });

  });

  $('.linkedin-checkbox').on('focus', function () {
    $(this).blur();
  });
}

function configS3Upload () {

  $('.directUpload').find("input:file").each(function(i, elem) {
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