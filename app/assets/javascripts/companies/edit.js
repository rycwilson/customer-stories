
function companiesEdit () {
}

function companiesEditListeners () {
  companyProfileListeners();
  templateEditorListeners();
  storyTagsListeners();
  storyCTAsListeners();
}

function storyTagsListeners () {

  $(document).on('change', '.company-tags',
    function () {
      $('#company-tags-submit, #company-tags-reset').prop('disabled', false);
    });
}

function storyCTAsListeners () {

  var inputsArePresent = function () {
    return ($('#new_cta_link_description').val() !== '' &&
            $('#new_cta_link_display_text').val() !== '' &&
            $('#new_cta_link_url').val() !== '') ||
           ($('#new_cta_form_description').val() !== '' &&
            $('#new_cta_form_display_text').val() !== '' &&
            $('#new_cta_form_html').val() !== '');
  };

  $(document)
    .on('input', '#new-cta-inputs',
      function () {
        if (inputsArePresent()) {
          $('#new-cta-submit, #new-cta-reset').prop('disabled', false);
        } else {
          $('#new-cta-submit, #new-cta-reset').prop('disabled', true);
        }
      })
    .on('click', '#new-cta-form .btn-group input',
      function () {
        $('.link-input,.html-input').toggle();
        $('.link-input,.html-input').val('');
        if ($('#cta_type').val() === 'CTALink') {
          $('#cta_type').val('CTAForm');
        } else if ($('#cta_type').val() === 'CTAForm') {
          $('#cta_type').val('CTALink');
        }
      })
    .on('input', '#new-cta-form',
      function () {
        if ($(this).find('button[type="submit"]').prop('disabled') === false) {
          return false;
        }
        $linkRadio = $(this).find('.btn-group input:first');
        $formRadio = $(this).find('.btn-group input:last');
        if ($linkRadio.prop('checked') &&
            $.makeArray($('.link-input')).every(function (el) {
              return el.value !== '';
            })) {
          $(this).find('button[type="submit"]').prop('disabled', false);
        } else if ($formRadio.prop('checked') &&
                   $.makeArray($('.html-input')).every(function (el) {
                     return el.value !== '';
                   })) {
          $(this).find('button[type="submit"]').prop('disabled', false);
        }
      })
    .on('click', '#story-ctas .glyphicon-remove',
      function () {
        var id = $(this).closest('li').data('cta-id');
        $.ajax({
          url: '/ctas/' + id,
          method: 'delete',
          success: function (data, status, xhr) {
            if (data.isPrimary) {
              $('#primary-cta li')
                .empty().append('<span>Add a primary CTA</span>');
              $('input[type="checkbox"][id="is_primary"]')
                .prop('disabled', false);
            } else {
              $('li[data-cta-id="' + data.id + '"]').remove();
            }
          }
        });
      });
}

function templateEditorListeners () {

  // load selected email template for editing
  $(document).on('change', '.templates-select', function () {
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

  $(document).on('loadTemplate', '.note-editable', function () {
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
  $(document).on('input summernote.change',
                 '#template_subject, #email-template-editor', function () {
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

  $(document).on('click', '#restore-current-template', function () {
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

  $(document).on('click', '#restore-all-templates', function () {
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

  $(document).on('click', '#test-template', function () {
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

  $(document).on('click', '#cancel-template', function () {
    $('.templates-select').trigger('change');
  });


}

function companyProfileListeners() {

  // CSP test-colors-btn
  var defaultHeaderStyle = "background:linear-gradient(45deg, #FBFBFB 0%, #85CEE6 100%);color:#333333;",
      defaultColorLeft = '#fbfbfb',
      defaltColorRight = '#85cee6',
      defaultTextColor = '#333333';

  $(document)
    .on('click', '#test-colors-btn',
      function () {
        var color1 = $('input#company_header_color_1').val(),
            color2 = $('input#company_header_color_2').val(),
            headerTextColor = $('input#company_header_text_color').val();
        $('.navbar, .logo-upload .thumbnail').css(
            'background', 'linear-gradient(45deg, ' + color1 + ' 0%, ' + color2 + ' 100%)');
        $('.navbar').css('color', headerTextColor);
      })
      // Dynamically change the max-height of the select box
      //   (a static setting doesn't work for some reason)

    .on('select2:open', '#company-profile',
      function () {
        $(".select2-container--bootstrap .select2-results > .select2-results__options").css('max-height', 0);
      })

    .on('click', '#restore-colors-btn, #profile-form-reset',
      function () {
        var headerStyle = app.company ? app.company.header_style : defaultHeaderStyle,
            colorLeft = app.company ? app.company.header_color_1 : defaultColorLeft,
            colorRight = app.company ? app.company.header_color_2 : defaultColorRight,
            textColor = app.company ? app.company.header_text_color : defaultTextColor;
        if (this.id === 'restore-colors-btn') {
          $('.navbar, .logo-upload .thumbnail').attr('style', headerStyle);
        }
        $('#company_header_color_1').minicolors('value', colorLeft);
        $('#company_header_color_2').minicolors('value', colorRight);
        $('#company_header_text_color').minicolors('value', textColor);
      });

}







