
function contributorActionsListeners () {

  var invitation,  // { contributor: ..., subject: ..., body: ... }
      contributionPath = function (contributionId) {
        return '/contributions/' + contributionId;
      },
      missingCuratorInfo = function () {
        return ['first_name', 'last_name', 'photo', 'phone', 'position']
          .filter(function (item) { return app.current_user[item] === '' ; });
      },

      // type is 'send' or 'readonly'
      showInvitation = function (invitation, type) {
        // things go haywire if a different selector is used, e.g. $('textarea')
        var $modal = $('#contribution-request-modal'),
            $editor = $modal.find("[data-provider='summernote']");
            formattedDate = function (date) {
              return moment(date).calendar(null, {
                sameDay: '[today]',
                lastDay: '[yesterday]',
                lastWeek: '['+ moment(date).fromNow() +']',
                sameElse: 'M/DD/YY'
              }).split('at')[0];
            };

        $modal.one('hidden.bs.modal', function () {
          $(this).find('#to-contributor, .modal-body, .modal-footer').css('visibility', 'hidden');
        });

        $modal.one('shown.bs.modal', function () {
          // send or readonly
          $modal.find('.modal-content').addClass(type);
          if (type === 'send') {
            $modal.find('.modal-content').removeClass('readonly');
          } else {
            $modal.find('.modal-content').removeClass('send');
          }
          // set the readonly title (null is ok; formattedDate returns "Invalid")
          $modal.find('.readonly.modal-title span:last-child')
            .text(formattedDate(invitation.sent_at));
          // set the path
          $modal.find('form')
            .attr('action', contributionPath(invitation.contributionId));
          // recipient
          $modal.find('#to-contributor span:last-child').html(
            invitation.contributor.full_name + '&nbsp;&nbsp;' +
            '&lt' + invitation.contributor.email + '&gt'
          );
          // request subject
          $modal.find('[name="contribution[request_subject]"]')
            .val(invitation.subject)
            .attr('readonly', type === 'readonly' ? true : false);
          // request body
          $editor.summernote('code', invitation.body);
          // enable or disable editor
          $editor.summernote(
            type === 'readonly' ? 'disable' : 'enable'
          );
          $modal.find('#to-contributor, .modal-body, .modal-footer').css('visibility', 'visible');
        });
        $modal.modal('show');
      },

      getInvitation = function (contributionId, type) {

        $.ajax({
          url: contributionPath(contributionId),
          method: 'get',
          data: {
            get_invitation: true,
            send: type == 'send' ? true : false
          },
          dataType: 'json',
        })
          .done(function (contribution, status, xhr) {
            invitation = {
              contributionId: contribution.id,
              subject: contribution.request_subject,
              body: contribution.request_body,
              contributor: {
                full_name: contribution.contributor.full_name,
                email: contribution.contributor.email
              },
              sent_at: contribution.request_sent_at
            };
            showInvitation(invitation, type);
          });
      },

      toggleEmailProgress = function (state) {
        var $modal = $('#contribution-request-modal');
        if (state === 'on') {
          $modal.find('.modal-title').addClass('hidden');
          $modal.find('.progress').removeClass('hidden');
        } else {
          $modal.find('.modal-title').removeClass('hidden');
          $modal.find('.progress').addClass('hidden');
        }
      },

      removeContribution = function (id) {
        $.ajax({
          url: contributionPath(id),
          method: 'delete',
          dataType: 'json'
        })
          .done(function (contribution, status, xhr) {
            // might just be one table if other hasn't loaded
            var $tables = $('table[id*="contributors-table"]');
            $tables.DataTable()
              .row( $('[data-contribution-id="' + contribution.id + '"]') )
              .remove()
              .draw();

            // if this was the only contribution under a group, remove the group
            $tables.find('tr.group').each(function () {
              if ($(this).next().hasClass('group')) { $(this).remove(); }
            });
            // update app data
            // app.contributions = app.contributions.filter(function (c) {
            //   return c.id == contribution.id;
            // });
          });
      },

      modifyLinkDialog = function () {
        $('.link-dialog .note-link-url').prop('disabled', true);
        $('.link-dialog input[type="checkbox"]').prop('checked', true);
        $('.link-dialog input[type="checkbox"]').prop('disabled', true);
        $('.link-dialog .note-link-btn').removeClass('btn-primary').addClass('btn-success');  // for stying
      };

  $(document)

    .on('click', '.contributor-actions .send-request', function () {
      var contributionId = $(this).closest('tr').data('contribution-id');

      if (missingCuratorInfo().length > 0) {
        flashDisplay("Can't send email because the following Curator fields are missing: "  +
          missingCuratorInfo().join(', '), 'danger');
        return false;

      } else {
        getInvitation(contributionId, 'send');
      }

    })

    .on('click', '.contributor-actions .re-send-request', function () {
      var contributionId = $(this).closest('tr').data('contribution-id');

      if (missingCuratorInfo().length > 0) {
        flashDisplay("Can't send email because the following Curator fields are missing: "  +
          missingCuratorInfo().join(', '), 'danger');
        return false;

      } else {
        getInvitation(contributionId, 'send');
      }

    })

    .on('click', '.contributor-actions .remove', function () {
      var contributionId = $(this).closest('tr').data('contribution-id');
      bootbox.confirm({
        size: 'small',
        className: 'confirm-remove-contributor',
        closeButton: false,
        message: "<i class='fa fa-warning'></i>\xa0\xa0\xa0<span>Are you sure?</span>",
        buttons: {
          confirm: {
            label: 'Remove',
            className: 'btn-danger'
          },
          cancel: {
            label: 'Cancel',
            className: 'btn-default'
          }
        },
        callback: function (confirmRemove) {
          if (confirmRemove) { removeContribution(contributionId); }
        }
      });
    })

    .on('submit', '#contribution-request-form', function () {
      toggleEmailProgress('on');
    })

    // scroll can't be adjusted while the modal is hidden
    .on('hide.bs.modal', '#contribution-request-modal', function () {
      // there are a bunch of modals within the summernote editor, hence indexing
      $(this).find('.modal-body').eq(0).scrollTop(0);
      toggleEmailProgress('off');
    })

    .on('click', '.contributor-actions .view-request, ' +
                 'td.crowdsourcing-template.view-request a', function () {
      var contributionId = $(this).closest('tr').data('contribution-id');
      getInvitation(contributionId, 'readonly');
    })

    // BEWARE this will also fire from Successes view
    .on('click', '.contributor-actions .view-contribution, ' +
                 'td.status .view-contribution', function () {

      var contributionId = $(this).closest('tr').data('contribution-id'),
          formattedDate = function (date) {
              return moment(date).calendar(null, {
                sameDay: '[today]',
                lastDay: '[yesterday]',
                lastWeek: '['+ moment(date).fromNow() +']',
                sameElse: 'M/DD/YY'
              }).split('at')[0];
            };

      $.ajax({
        url: contributionPath(contributionId),
        method: 'get',
        data: {
          get_contribution_content: true
        },
        dataType: 'json'
      })
        .done(function (contribution, status, xhr) {
          $.when(
            $('#contribution-content-modal .modal-content').empty().append(
              _.template( $('#contribution-content-template').html() )({
                contributions: [contribution],
                successId: null,
                formattedDate: formattedDate
              })
            )
          )
            .done(function () {
              $('#contribution-content-modal').modal('show');
            });
        });

    })

    .on('click', '.contributor-actions .view-customer-win', function () {
      var successId = $(this).closest('tr').data('success-id');
      $('a[href="#successes"]').tab('show');
        $('#successes-filter').val('success-' + successId).trigger('change');
    })

    .on('click', '.contributor-actions .completed', function () {

      var dt = $(this).closest('table').DataTable(),
          $row = $(this).closest('tr'),
          rowData = dt.row($row).data(),
          $tdStatus = $row.find('td.status'),
          contributionId = $row.data('contribution-id');

      $.ajax({
        url: contributionPath(contributionId),
        method: 'put',
        data: { completed: true },
        dataType: 'json'
      })
        .done(function (data, status, xhr) {
          rowData.status = data.status;
          rowData.display_status = data.display_status;
          dt.row($row).data(rowData);
          $tdStatus.find('i').toggle();
          setTimeout(function () {
            $tdStatus.find('i').toggle();
          }, 2000);
          setTimeout(function () {
            if ( $('#show-completed').length &&
                 $('#show-completed').prop('checked') === false ) {
              $('#show-completed').trigger('change');
            }
          }, 2200);
        });
    })

    // keep link dialog modifications limited to contribution request
    .on('shown.bs.modal', '#contribution-request-modal', function () {
      $(document).on('shown.bs.modal', '.link-dialog', modifyLinkDialog);
    })
    .on('hidden.bs.modal', '#contribution-request-modal', function () {
      $(document).off('shown.bs.modal', '.link-dialog', modifyLinkDialog);
    });

}