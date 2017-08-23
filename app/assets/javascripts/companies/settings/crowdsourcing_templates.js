
function crowdsourcingTemplatesListeners () {

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