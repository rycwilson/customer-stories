
function templateActionsListeners () {

  var restoreTemplates = function (templates) {
    var templateIds = templates.map(function (t) { return t.id; });
    $.ajax({
      // pass array of template ids to the route
      url: '/companies/' + app.company.id + '/crowdsourcing_templates/' + JSON.stringify(templateIds),
      method: 'put',
      data: {
        restore: true,
        template_ids: templateIds,
        needs_refresh: templateIds.indexOf($('select.crowdsourcing-template').select2('data')[0].id) !== -1
      },
      dataType: 'script'
    });
  };

  $(document)

    .on('click', 'button.new-template, button.copy-template', function () {
      $('#crowdsourcing-template-submit').removeClass('show');
      if ($(this).hasClass('copy-template')) {
        sourceTemplateId = $('select.crowdsourcing-template').val();
      } else {
        sourceTemplateId = undefined;
      }
      $.ajax({
        url: '/companies/' + app.company.id + '/crowdsourcing_templates/new',
        method: 'get',
        data: { source_template_id: sourceTemplateId },
        dataType: 'html'
      })
        .done(function (html, status, xhr) {

          $.when($('#crowdsourcing-template-container').empty().append(html))
            .then(function () {
              initInvitationEditor();
              $('select.contributor-questions')
                .select2({
                  theme: 'bootstrap',
                  placeholder: 'Add a Question'
                });
              $('#crowdsourcing-template-form input[id="crowdsourcing_template_name"]')[0].focus();
              // reset select to placeholder
              $('select.crowdsourcing-template').val('').trigger('change.select2');
              $('#crowdsourcing-template-submit p').empty().append('New template');
              $('#crowdsourcing-template-submit').find('button').css('width', '135px').find('span').text('Create template');
              $('#crowdsourcing-template-submit').addClass('show');
            });
        });
    })

    .on('click', 'button.delete-template', function () {
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

    .on('click', 'button.restore-template', function () {
      // removed 'restore-selected' and 'restore-all'
      var $action = $(this),
          $select = $('select.crowdsourcing-template'),
          templates = [],
          confirmMesg = '<p>This action will restore the following invitation templates to factory default content</p>';

      // the if block will always execute
      if ($action.hasClass('restore-template')) {
        templates = [ { id: $select.val(), name: $select.find('option:selected').text() } ];
      }
      else {
        templates = $.map(
          $select.find('optgroup[label="Defaults"] option'), function (option) {
            return { id: option.value, name: option.label };
          }
        );
      }
      bootbox.confirm({
        className: 'confirm-restore',
        closeButton: false,
        title: "<i class='fa fa-question-circle-o'></i>\xa0\xa0\xa0<span>Confirm</span>",
        message: confirmMesg + '<ul><li>' + templates.map(function (t) { return t.name; }).join('</li><li>') + '</li></ul>',
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
          if (confirmRestore) { restoreTemplates(templates); }
        }
      });
    });

}