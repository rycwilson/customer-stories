// MVP plug-ins
//= require slimscroll/jquery.slimscroll
//= require magnific-popup/dist/jquery.magnific-popup
//= require datatables/media/js/jquery.dataTables
//= require datatables-plugins/integration/bootstrap/3/dataTables.bootstrap
//= require bootstrap-jasny/js/fileinput.js
//= require mvpready-admin

// Select2
//= require select2/dist/js/select2

// HTML editor for email templates
//= require summernote

// Color picker
//= require jquery.minicolors

var ready = function () {

  // not the best solution for remembering active tab, but it works
  // var lastCurateTab = localStorage.getItem('lastCurateTab');
  // var lastSettingsTab = localStorage.getItem('lastSettingsTab');
  // if (lastCurateTab) {
  //   $('[href="' + lastCurateTab + '"]').tab('show');
  // }
  // if (lastSettingsTab) {
  //   $('[href="' + lastSettingsTab + '"]').tab('show');
  // }

  configSelect2();
  configS3Upload();
  configSummernote();
  configMiniColors();
  initListeners();
  initTemplateEditor();
  templateEditorListeners();
  initFormLogoBackground();
  initNewStoryValidator();
  adjustPromoCSS();

  // console.log('ready()');

};

$(document).ready(function () {
  // console.log('calling ready from companies.js - doc.ready');
  ready();
});

// $(document).on('turbolinks:load', function () {
//   console.log('calling ready from companies.js - turbolinks:load');
//   ready();
// });

function initTemplateEditor () {
  $('.note-editable').attr('contenteditable', 'false');
}

function templateEditorListeners () {

  // load selected email template for editing
  $('.templates-select').on('change', function () {
    /*
      This event will get triggered by a re-populating of the select options,
      such as happens when all templates are restored to default.
      When this happens, if no template has been loaded, do not send a GET
    */
    if ($(this).val() === null)
      return false;

    $.get('/email_templates/' + $(this).val(), function (data, status, xhr) {
      // enable the editor
      $('.note-editable').attr('contenteditable', 'true');
      $('#template_subject').val(data.subject);
      $('.note-editable').html(data.body);
      $('#email-templates-form').attr('action', '/email_templates/' + data.id);
      $('.note-editable').trigger('loadTemplate');
    });

  });

  $('.note-editable').on('loadTemplate', function () {
    // show the editor
    // $(this).closest('form-group')
    // restore this template
    $('#restore-current-template').parent().removeClass('disabled');
    // test template
    $('#test-template').prop('disabled', false);
    // save
    $(this).closest('form').find('[type=submit]').prop('disabled', true);
    // cancel
    $('#cancel-template').prop('disabled', true);
  });

  /*
    Detect changes in template editor (subject or body)
  */
  $('#template_subject, #summernote-editor').on('input summernote.change', function () {
    // textarea responds to .text(); text field responds to .val()
    if ($(this).text().length > 0 || $(this).val().length > 0) {
      $('#save-template').prop('disabled', false);
      $('#test-template').prop('disabled', false);
      $('#cancel-template').prop('disabled', false);
    } else {
      $('#save-template').prop('disabled', true);
      $('#test-template').prop('disabled', true);
      // cancel stays active once a change is made
    }
  });

  $('#restore-current-template').on('click', function () {
    if ($(this).parent().hasClass('disabled'))
      return false;

    var $a = $(this);
    $.ajax({
      url: '/email_templates/' +
              $('#email-templates-form').find('select:first').val(),
      method: 'put',
      data: { 'restore': true },
      success: function (data, status, xhr) {
        $('#template-subject').text(data.template.subject);
        $('.note-editable').html(data.template.body);
        $a.closest('form').find('[type=submit]').prop('disabled', true);
        $('#cancel-template').prop('disabled', true);
        flashDisplay(data.flash, 'success');
      }
    });
  });

  $('#restore-all-templates').on('click', function () {
    var templateId = $('#email-templates-form').find('select:first').val(),
        newOptions = "",
        responseTemplateId;
    if (templateId === "")
      templateId = 0;
    $.ajax({
      url: '/email_templates/' + templateId,
      method: 'put',
      data: { 'restore_all': true },
      success: function (data, status, xhr) {
        // if no loaded template when request was made,
        // a null current_template is returned
        responseTemplateId = (data.current_template || { id: 0 }).id;
        data.templates_select.forEach(function (option, index) {
          // if this is the first option AND no template was loaded,
          // first option to allow for placeholder
          if (index === 0 && responseTemplateId === 0) {
            newOptions += "<option value></option>";
          } else if (option[1] === responseTemplateId) {
            newOptions += "<option selected='selected' value='" + option[1] + "'>" + option[0] + "</option>";
          } else {
            newOptions += "<option value='" + option[1] + "'>" + option[0] + "</option>";
          }
        });
        // select2 doesn't currently support wholesale replacement of options;
        // here's a workaround:
        // (https://github.com/select2/select2/issues/2830#issuecomment-74971872)
        $('.templates-select').html(newOptions).change();
        flashDisplay(data.flash, 'success');
      }
    });
  });

  $('#test-template').on('click', function () {
    // don't use .serialize() or it will send a PUT request
    // (not that it really matters what kind of request it is - POST or PUT is fine)
    var data = {
      subject: $('#template_subject').val(),
         body: $('.note-editable').html()
    };
    $.post(
        '/email_templates/' + $('.templates-select').val() + '/test',
        data,
        function (data, status) {
          flashDisplay(data.flash, 'info');
        }
    );
  });

  $('#cancel-template').on('click', function () {
    $('.templates-select').trigger('change');
  });

  $('button').on('focus', function () {
    var _this = $(this);
    window.setTimeout(function () {
      _this.blur();
    }, 200);
  });

}

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

  $('#test-colors-button').on('click', function () {
    var color1 = $('input#company_nav_color_1').val(),
        color2 = $('input#company_nav_color_2').val(),
      navTextColor = $('input#company_nav_text_color').val();
    $('header.navbar').css(
        'background', 'linear-gradient(45deg, ' + color1 + ' 0%, ' + color2 + ' 100%)');
    $('header.navbar').css('color', navTextColor);
    /*
      the restore button is defined in companies#edit javascript_tag,
      so it has access to admin_navbar_style helper and company color attributes
    */
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
        ['view', ['codeview']],
        // ['help', ['help']]
      ],
    });
  });

  $('.note-image-url').parent().css('padding', '0 2.7%');
}

function configMiniColors () {
  $('.mini-colors').minicolors({ theme: 'bootstrap' });
}

/*
  It would be nice to have a .tags class to which the common
  settings (theme, tags) can be applied, but that doesn't work.
  That is, only one .select2() call per element will work,
  any others will be ignored
*/
function configSelect2 () {
  /*
    Company tags are for maintaining a list of options for Story tagging
    Thus, company tag select boxes should not show a list of options, because the
    options are being created at this stage.  There is nothing to select
    These listeners will dynamically change the max-height of the select box
    (a static setting doesn't work for some reason)
  */
  $('.company-tags').select2({
    theme: 'bootstrap',
    tags: true,
    placeholder: 'add tags'
  });

  $('#company-profile').on('select2:open', function () {
    $(".select2-container--bootstrap .select2-results > .select2-results__options").css('max-height', 0);
  });

  /*
    Email templates
  */
  $('.templates-select').select2({
    theme: 'bootstrap',
    placeholder: 'select a template ...'
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
      placeholder: 'select tag(s)'
    });

  }
}

function initFormLogoBackground () {
  var $thumbnails = $("form[id*='company'] .thumbnail");
  var companyColor1 = $('nav').css('background')
                                 .match(/\(((\d|\s|,)+)\)/g)[1]
                                 .slice(1, -1)
                                 .split(', ')
                                 .map(function (color) {
                                    var hexVal = parseInt(color, 10).toString(16);
                                    if (hexVal.length === 1) {
                                      hexVal += hexVal;
                                    }
                                    return hexVal;
                                  })
                                 .join('');
  $thumbnails.each(function () {
    $(this).css('background-color', '#' + companyColor1);
  });
}

/*
  Detect changes in new story modal required inputs, and enable
  submit button accordingly.
  'change' event is for the select boxes; 'input' for text box
*/
function initNewStoryValidator () {
  $('#new-story-modal').on('change input', function () {
    if ($('#story_customer').val() &&
        $('#story_title').val()) {
      $(this).find("[type='submit']").prop('disabled', false);
    }
    else {
      $(this).find("[type='submit']").prop('disabled', true);
    }
  });
}

function adjustPromoCSS () {
  $(document).on('shown.bs.tab', "a[href='#promote']", function () {

    var ad2LogoWidth = parseInt($('.ad2-logo').css('width'), 10);

    $('.ad1-text').each(function () {
      if ($(this).data('text-length') >= 85) {
        $(this).css('font-size', '22px');
      }
    });

    $('.ad2-text').each(function () {
      $(this).css('padding-left', ad2LogoWidth + 20);
      if ($(this).data('text-length') >= 85) {
        $(this).css('font-size', '20px');
        $(this).css('top', '10px');
      } else if ($(this).data('text-length') >= 75) {
        $(this).css('font-size', '22px');
        $(this).css('top', '8px');
      }
    });
  });
}













