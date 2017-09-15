
function templateActionsListeners () {

  $(document)
    .on('click', '#template-actions-dropdown .new-template, ' +
                 '#template-actions-dropdown .copy-template', function () {

      if ($(this).hasClass('copy-template')) {
        copyTemplateId = $('select.crowdsourcing-template').val();
      } else {
        copyTemplateId = undefined;
      }

      $.ajax({
        url: '/companies/' + app.company.id + '/crowdsourcing_templates/new',
        method: 'get',
        data: { copy_template_id: copyTemplateId },
        dataType: 'html',
        success: function (html, status, xhr) {
          $.when( $('#crowdsourcing-template-container').empty().append(html) )
            .then(function () {
              initEmailRequestEditor();
              $('select.contributor-questions')
                .select2({
                  theme: 'bootstrap',
                  placeholder: 'Add a Question'
                });
              $('#crowdsourcing-template-form input[id="crowdsourcing_template_name"]')[0].focus();
              // reset select to placeholder
              $('select.crowdsourcing-template').val('').trigger('change.select2');
            });
        }
      });
    })

    .on('click', '#template-actions-dropdown .test-template', function () {
      // don't use .serialize() or it will send a PUT request
      // (not that it really matters what kind of request it is - POST or PUT is fine)
      var data = {
        subject: $('#crowdsourcing_template_request_subject').val(),
           body: $('.note-editable').html()
      };

      $('#template-actions-dropdown button[type="button"] span').toggle();
      $('#template-actions-dropdown button[type="button"] .fa-spinner').toggle();

      $.ajax({
        url: '/companies/' + app.company.id + '/crowdsourcing_templates/' + $('select.crowdsourcing-template').val() + '/test',
        method: 'post',
        data: data,
        success: function (data, status) {
          $('#template-actions-dropdown button[type="button"] .fa-spinner').toggle();
          $('#template-actions-dropdown button[type="button"] span').toggle();
          flashDisplay(data.flash, 'info');
        }
      });
    })

    .on('click', '#template-actions-dropdown .delete-template', function () {

      var deleteTemplateId = $('select.crowdsourcing-template').select2('data')[0].id;

      bootbox.confirm({
        size: 'small',
        className: 'confirm-delete-template',
        closeButton: false,
        message: "<i class='fa fa-warning'></i>\xa0\xa0\xa0<span>Are you sure?</span>",
        buttons: {
          confirm: {
            label: 'Delete',
            className: 'btn-danger'
          },
          cancel: {
            label: 'Cancel',
            className: 'btn-default'
          }
        },
        callback: function (confirmDelete) {
          if (confirmDelete) {
            $.ajax({
              url: '/companies/' + app.company.id + '/crowdsourcing_templates/' + deleteTemplateId,
              method: 'delete',
              dataType: 'script'
            });
          }
        }
      });
    })

    .on('click', '#template-actions-dropdown .restore-selected, ' +
                 '#template-actions-dropdown .restore-all', function () {

      var $action = $(this), $select = $('select.crowdsourcing-template'),
          restoreTemplateNames =
            $action.hasClass('restore-selected') ? [$select.select2('data')[0].text] :
            $.map( $select.find('optgroup[label="Defaults"] option'), function (option) {
              return option.label;
            }),
          message = '<p>This action will restore the following Crowdsourcing Templates to factory default content</p><ul><li>' +
                    restoreTemplateNames.join('</li><li>') + '</li></ul>';

      bootbox.confirm({
        className: 'confirm-restore',
        closeButton: false,
        title: "<i class='fa fa-question-circle-o'></i>\xa0\xa0\xa0<span>Confirm</span>",
        message: message,
        buttons: {
          confirm: {
            label: 'Restore',
            className: 'btn-secondary'
          },
          cancel: {
            label: 'Cancel',
            className: 'btn-default'
          }
        },
        callback: function (confirmRestore) {
          if (confirmRestore) { restoreTemplates($action, $select); }
        }
      });
    });

}

function restoreTemplates ($action, $select) {

  var restoreTemplateIds =
        $action.hasClass('restore-selected') ? [$select.select2('data')[0].id] :
        $.map( $select.find('optgroup[label="Defaults"] option'), function (option) {
          return option.value;
        });

  $.ajax({
    // pass array of template ids to the route
    url: '/companies/' + app.company.id + '/crowdsourcing_templates/' + JSON.stringify(restoreTemplateIds),
    method: 'put',
    data: {
      restore: true,
      template_ids: restoreTemplateIds,
      refresh_template: restoreTemplateIds.indexOf($select.select2('data')[0].id) !== -1
    },
    dataType: 'script'
  });
}