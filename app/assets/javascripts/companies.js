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

// HTML editor for email templates
//= require summernote

$(function () {

  // not the best solution for remembering active tab, but it works
  var lastTab = localStorage.getItem('lastTab');
  var lastSubTab = localStorage.getItem('lastSubTab');
  if (lastTab) {
    $('[href="' + lastTab + '"]').tab('show');
  }
  if (lastSubTab) {
    $('[href="' + lastSubTab + '"]').tab('show');
  }

  configSelect2();
  configS3Upload();
  configSummernote();
  initListeners();

});

function initListeners() {
  // remember the last active tab for server submit / page refresh
  $('.mainnav-menu a[data-toggle="tab"]').on('shown.bs.tab', function () {
    localStorage.setItem('lastTab', $(this).attr('href'));
  });
  $('.nav-stacked a[data-toggle="tab"]').on('shown.bs.tab', function () {
    localStorage.setItem('lastSubTab', $(this).attr('href'));
  });

  // reset new story modal form
  $('#new-story-modal').on('hidden.bs.modal', function () {
    // form inputs to default values... (in this case just title)
    $(this).find('form')[0].reset();
    // select2 inputs to default values...
    $('.new-story-customer').select2('val', '');  // single select
    $('.new-story-tags').val('').trigger('change');  // multiple select
  });

  // load selected email template for editing
  $('.templates-select').on('change', function () {
    $.get('/email_templates/' + $(this).val(), function (data, status, xhr) {
      console.log(data);
      $('#template_subject').val(data.subject);
      $('.note-editable').html(data.body);
      $('#email-template-form').attr('action', '/email_templates/' + data.id);
    });
  });

  // when a modified template is saved, remove the
  // $('#email-template-form').on('submit', function (e) {
  //   e.preventDefault();
  //   var templateBody = $(this).find('.note-editable').html();
  //   // use a conditional expression in order to delay submission of the form
  //   // until after necessary changes are made
    // var newBody = templateBody.replace(
    //                     /(id=('|")curator-img('|") src=)('|")https:\/\/\S+('|")/,
    //                     "$1[curator_img_url]" );
  //   if ($(this).find('.note-editable').html( newBody ) ) {
  //     console.log('well?');
  //     // $(this).trigger('submit');
  //   }
  // });
}

function configSummernote () {
  $('[data-provider="summernote"]').each(function () {
    $(this).summernote({
      toolbar: [
        // ['style', ['style']],
        ['font', ['bold', 'italic', 'underline']], //, 'clear']],
        ['fontname', ['fontname']],
        // ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['height', ['height']],
        // ['table', ['table']],
        ['insert', ['link', 'picture', 'hr']],
        ['view', ['codeview']],   // fullscreen
        // ['help', ['help']]
      ],
    });
  });
}

// It would be nice to have a .tags class to which the common
// settings (theme, tags) can be applied, but that doesn't work.
// That is, only one .select2() call per element will work,
// any others will be ignored
function configSelect2 () {

  $('.company-tags').select2({
    theme: 'bootstrap',
    tags: true,
    placeholder: 'add tags'
  });

  $('.templates-select').select2({
    theme: 'bootstrap',
    placeholder: 'select a template...'
  });

  // Company tags are for maintaining a list of options for Story tagging
  // Thus, company tag select boxes should not show a list of options, because the
  //   options are being created at this stage.  There is nothing to select
  // These listeners will dynamically change the max-height of the select box
  // Industries select box not included since there will be some defaults to select from
  $('#company-profile').on('select2:open', '#company_tags_product_category_', function () {
    $(".select2-container--bootstrap .select2-results > .select2-results__options").css('max-height', 0);
  });
  $('#company-profile').on('select2:close', '#company_tags_product_category_', function () {
    $(".select2-container--bootstrap .select2-results > .select2-results__options").css('max-height', '200px');
  });
  $('#company-profile').on('select2:open', '#company_tags_product_', function () {
    $(".select2-container--bootstrap .select2-results > .select2-results__options").css('max-height', 0);
  });
  $('#company-profile').on('select2:close', '#company_tags_product_', function () {
    $(".select2-container--bootstrap .select2-results > .select2-results__options").css('max-height', '200px');
  });


  // has the curate tab content been rendered?
  //   (it may not have been if company not yet registered)
  if ($('#curate').length) {
    // is there a list of existing customers to choose from?
    if ($('.new-story-customer').length) {

      $(".new-story-customer").select2({  // single select
        theme: "bootstrap",
        tags: true,  // to allow new company creation
        placeholder: 'select or add a new customer',
        // allowClear: true
      });
    }

    // when tagging stories, user can't create new tags,
    // has to do so under company settings
    // TODO: enable new tags from here?
    $(".new-story-tags").select2({
      theme: 'bootstrap',
      placeholder: 'select tags'
    });

  }
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


