
function selectTemplateListeners () {

  // keep track of previous selection in case a change is canceled
  var previousTemplateId;

  var initTemplate = function () {
    initEmailRequestEditor();
    $('select.contributor-questions')
      // .prepend('<option selected/>')  // empty option for placeholder
      .select2({
        theme: 'bootstrap',
        placeholder: 'Add a Question'
      });
  };

  var toggleActions = function (isDefault) {
    var $dropdown = $('#template-actions-dropdown');

    // options enabled for any template
    $dropdown.find('.copy-template').removeClass('disabled');

    // restore current template only applies to defaults
    if (isDefault) {
      $dropdown.find('.restore-selected').removeClass('disabled');
      $dropdown.find('.delete-template').addClass('disabled');
    } else {
      $dropdown.find('.restore-selected').addClass('disabled');
      $dropdown.find('.delete-template').removeClass('disabled');
    }
  };

  var selectTemplate = function ($select, templateId) {

    // new selection (now that we're past confirmation)
    $select.val(templateId).trigger('change.select2');

        var isDefault = $select.find('option:selected').closest('optgroup')
                      .attr('label') == 'Defaults' ? true : false,
        initFormControls = function () {
          setTimeout(function () {
            var $form = $('#crowdsourcing-template-form'),
                $button = $('button[type="submit"][form="crowdsourcing-template-form"]');
            if ($form.find('input[name="_method"][value="put"]').length) {
              $button.css('width', '114px').find('span').text('Save changes');
            } else {
              $button.css('width', '135px').find('span').text('Create template');
            }
            $('#crowdsourcing-template-submit p').empty();
            if ($('select.crowdsourcing-template').val()) {
              $('#crowdsourcing-template-submit p').append(
                'Template: ' + $('select.crowdsourcing-template').find('option:selected').text()
              );
            } else {
              $('#crowdsourcing-template-submit p').append('New template');
            }
            $('#crowdsourcing-template-submit').addClass('show');
          }, 200);
        };

    // new template
    if ($select.val() === '0') {
      // reset select to placeholder
      $select.val('').trigger('change.select2');
      $('#template-actions-dropdown .new-template').trigger('click');
      initFormControls();
      return;
    }

    $('#template-actions-dropdown button').prop('disabled', true);

    $.ajax({
      url: '/companies/' + app.company.id + '/crowdsourcing_templates/' + $select.val() + '/edit',
      method: 'get',
      data: {
        // was this template just created? (if undefined nothing will be sent)
        new_template: $('#crowdsourcing-template-form').data('new')
      },
      dataType: 'html'
    })
      .done(function (html, status, xhr) {
        if ($('button[type="submit"][form="crowdsourcing-template-form"]').find('span').css('display') === 'none') {
          $('button[type="submit"][form="crowdsourcing-template-form"]').find('span, .fa-spin').toggle();
        }
        $.when($('#crowdsourcing-template-container').empty().append(html))
          .then(function () {
            $('#crowdsourcing-template-form').data('new', '');
            $('#template-actions-dropdown button').prop('disabled', false);
            toggleActions(isDefault);
            initTemplate();
            initFormControls();
            previousTemplateId = templateId;
          });
      });
  };

  $(document)
    .on('focus', 'select.crowdsourcing-template', function () {
      previousTemplateId = $(this).val();
    })

    .on('change', 'select.crowdsourcing-template', function () {
      var $select = $(this);
      // keep the existing selection in place pending confirmation
      var templateId = $select.val();

      $('#crowdsourcing-template-submit').removeClass('show');
      // why is the timeout necessary??
      // setTimeout(function () { $('#crowdsourcing-template-submit').removeClass('show'); }, 0);
      $select.val(previousTemplateId).trigger('change.select2');

      if ( $('#crowdsourcing-template-form').data('dirty') ) {
        bootbox.confirm({
          size: 'small',
          className: 'confirm-unsaved-changes',
          closeButton: false,
          message: "<i class='fa fa-warning'></i>\xa0\xa0\xa0<span>Unsaved changes will be lost</span>",
          buttons: {
            confirm: {
              label: 'Continue',
              className: 'btn-default'
            },
            cancel: {
              label: 'Cancel',
              className: 'btn-default'
            }
          },
          callback: function (continueWithoutSave) {
            if (continueWithoutSave) { selectTemplate($select, templateId); }
          }
        });
      } else {
        selectTemplate($select, templateId);
      }
    });
}

