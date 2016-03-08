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

var ready = function () {

  // not the best solution for remembering active tab, but it works
  var lastCurateTab = localStorage.getItem('lastCurateTab');
  var lastSettingsTab = localStorage.getItem('lastSettingsTab');
  if (lastCurateTab) {
    $('[href="' + lastCurateTab + '"]').tab('show');
  }
  if (lastSettingsTab) {
    $('[href="' + lastSettingsTab + '"]').tab('show');
  }

  configSelect2();
  configS3Upload();
  configSummernote();
  initListeners();

};

/*
  with turbolinks in place, js only runs on initial page load
  for example, js does not run when going from stories#show to stories#edit,
    and this results in plug-ins not being initialized
  below ensures that js runs each time a stories/ page loads
  both are needed
*/
$(document).ready(ready);
$(document).on('page:load', ready);


function initListeners() {
  // remember the last active tab for server submit / page refresh
  $('.mainnav-menu a[data-toggle="tab"]').on('shown.bs.tab', function () {
    localStorage.setItem('lastCurateTab', $(this).attr('href'));
  });
  $('.nav-stacked a[data-toggle="tab"]').on('shown.bs.tab', function () {
    localStorage.setItem('lastSettingsTab', $(this).attr('href'));
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
      $('.note-editable').trigger('input');
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

  $('.note-editable').on('input', function () {
    if ($(this).text().length > 0)
      $(this).closest('form').find('[type=submit]').prop('disabled', false);
    else
      $(this).closest('form').find('[type=submit]').prop('disabled', true);
  });
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