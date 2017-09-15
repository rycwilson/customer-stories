
function selectTemplateListeners () {

  $(document)
    .on('change', 'select.crowdsourcing-template', function () {

      if ($('#crowdsourcing-template-form').data('dirty')) {
        var $this = $(this);
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
            if (continueWithoutSave) { selectTemplate($this); }
          }
        });
      } else {
        selectTemplate( $(this) );
      }
    });
}

function selectTemplate ($select) {

  var isDefaultTemplate = $select.find('option:selected')
                                 .closest('optgroup')
                                 .attr('label') == 'Defaults' ? true : false;
  /*
    This event will get triggered by a re-populating of the select options,
    such as happens when all templates are restored to default.
    When this happens, if no template has been loaded, do not send a GET
  */
  if ($select.val() === null)
    return false;

  // new template
  if ($select.val() === '0') {
    // reset select to placeholder
    $select.val('').trigger('change.select2');
    $('#template-actions-dropdown .new-template').trigger('click');
    return false;
  }

  $('#template-actions-dropdown button').prop('disabled', true);

  var initTemplate = function () {
    initEmailRequestEditor();
    $('select.contributor-questions')
      // .prepend('<option selected/>')  // empty option for placeholder
      .select2({
        theme: 'bootstrap',
        placeholder: 'Add a Question'
      });
  };

  var toggleActions = function () {
    var $dropdown = $('#template-actions-dropdown');

    // options enabled for any template
    $dropdown.find('.copy-template, .test-template')
      .each(function () { $(this).removeClass('disabled'); });

    // restore current template only applies to defaults
    if (isDefaultTemplate) {
      $dropdown.find('.restore-selected').removeClass('disabled');
      $dropdown.find('.delete-template').addClass('disabled');
    } else {
      $dropdown.find('.restore-selected').addClass('disabled');
      $dropdown.find('.delete-template').removeClass('disabled');
    }

  };

  $.ajax({
    url: '/companies/' + app.company.id +
            '/crowdsourcing_templates/' + $select.val() + '/edit',
    method: 'get',
    data: {
      // was this template just created? (if undefined nothing will be sent)
      new_template: $('#crowdsourcing-template-form').data('new')
    },
    dataType: 'html',
    success: function (html, status, xhr) {
      $.when( $('#crowdsourcing-template-container').empty().append(html) )
        .then(function () {
          $('#template-actions-dropdown button').prop('disabled', false);
          toggleActions();
          initTemplate();
          $('#crowdsourcing-template-form').data('new', '');
        });
    }
  });
}