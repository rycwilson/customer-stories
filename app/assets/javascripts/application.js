//
//= require jquery/dist/jquery
//= require jquery-ujs/src/rails
// require turbolinks
//= require underscore/underscore
//= require bootstrap-sass/assets/javascripts/bootstrap-sprockets
//= require mvpready-core
//= require mvpready-helpers
//= require flot/jquery.flot

// AWS S3 upload
//= require jquery-ui/ui/widget
//= require jquery-file-upload/js/jquery.fileupload

// require_tree ./sitewide (under construction)

// eventLogs();

$(function() {

  initTooltips();

  (function syncHideFlash () {
    setTimeout(function () {
      $('#flash').slideUp();
    }, 3000);
    setTimeout(function () {
      $('#flash').addClass('hidden')
                 .removeClass('alert-success alert-info alert-warning alert-danger')
                 .empty();
    }, 3500);
  }());



  // clear localStorage
  // $('#logout').on('click', function () {
  //   localStorage.clear();
  //   sessionStorage.clear();
  // });

});

function eventLogs () {
  $(document).ready(function () {
    console.log('doc.ready');
  });

  $(document).on('turbolinks:load', function () {
    console.log('turbolinks:load');
  });

  $(document).on('page:change', function () {
    console.log('page:change');
  });

  $(document).on('page:load', function () {
    console.log('page:load');
  });

  $(window).on('load', function () {
    console.log('window load');
  });
}

// status should be one of: success, info, warning, danger
function flashDisplay (mesg, status) {
  $('#flash').removeClass('hidden')
             .addClass('alert-' + status)
             .append(mesg)
             .hide().append(flash).fadeIn('fast');

  setTimeout(function () {
    $('#flash').slideUp();
  }, 3000);

  setTimeout(function () {
    $('#flash').addClass('hidden')
               .removeClass('alert-' + status);
    $('#flash div').empty();

    // dispay:none setting appears after first click-cycle,
    // leads to subsequent failures
    // solution...
    $('#flash').css('display', '');
    // remove all text, leave child elements
    $('#flash').html($('#flash').children());
  }, 3500);
}

function initTooltips () {
  $('[data-toggle="tooltip"]').tooltip();
}


// need to vlidate input file name
// http://stackoverflow.com/questions/22387874/jquery-validate-plugin-bootstrap-jasny-bootstrap-file-input-regex-validation
function configS3Upload () {

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
              // console.log(data, status);
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













