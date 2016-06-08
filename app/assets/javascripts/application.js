// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery/dist/jquery
//= require jquery-ujs/src/rails
// require turbolinks
//= require underscore/underscore
//= require bootstrap-sass/assets/javascripts/bootstrap-sprockets
//= require mvpready-core
//= require mvpready-helpers
//= require flot/jquery.flot

// require_tree ./sitewide (under construction)

// eventLogs();

$(function() {

  initTooltips();

  setTimeout(function () {
    $('#flash').slideUp();
  }, 3000);

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
  $('#flash').toggleClass('hidden alert-' + status).append(mesg);
  $('#flash').hide().append(flash).fadeIn('fast');

  setTimeout(function () {
    $('#flash').slideUp();
  }, 3000);

  setTimeout(function () {
    $('#flash').toggleClass('hidden alert-' + status);
    // dispay:none setting appears after first click-cycle,
    // leads to subsequent failures
    // solution...
    $('#flash').css('display', '');
    // remove all text, leave child elements
    $('#flash').html($('#flash').children());
  }, 4000);
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

function initTooltips () {
  $('[data-toggle="tooltip"]').tooltip();
}












