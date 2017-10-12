
function contributorActionsListeners () {

  var contributionRequest,  // { contributor: ..., subject: ..., body: ... }
      contributionPath = function (contributionId) {
        return '/contributions/' + contributionId;
      },
      missingCuratorInfo = function () {
        return ['first_name', 'last_name', 'photo', 'phone', 'position']
          .filter(function (item) { return app.current_user[item] === '' ; });
      },
      // type is 'send' or 'readonly'
      loadContributionRequest = function (contributionRequest, type, callback) {
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

        // send or readonly
        $modal.find('.modal-content').addClass(type);
        if (type === 'send') {
          $modal.find('.modal-content').removeClass('readonly');
        } else {
          $modal.find('.modal-content').removeClass('send');
        }
        // set the readonly title (null is ok; formattedDate returns "Invalid")
        $modal.find('.readonly.modal-title span:last-child')
          .text(formattedDate(contributionRequest.sent_at));
        // set the path
        $modal.find('form')
          .attr('action', contributionPath(contributionRequest.id));
        // recipient
        $modal.find('#request-recipient').html(
          contributionRequest.contributor.full_name + '&nbsp;&nbsp;' +
          '&lt' + contributionRequest.contributor.email + '&gt'
        );
        // request subject
        $modal.find('[name="contribution[request_subject]"]')
          .val(contributionRequest.subject)
          .attr('readonly', type === 'readonly' ? true : false);
        // request body
        $editor.summernote('code', contributionRequest.body);
        // enable or disable editor
        $editor.summernote(
          type === 'readonly' ? 'disable' : 'enable'
        );



        callback();

      },
      showContributionRequest = function (contributionId, type) {
        var callback = function () {
          $('#contribution-request-modal').modal('show');
        };
        $.ajax({
          url: contributionPath(contributionId),
          method: 'get',
          data: { get_contribution_request: true },
          dataType: 'json',
        })
          .done(function (contribution, status, xhr) {
            contributionRequest = {
              id: contribution.id,
              subject: contribution.request_subject,
              body: contribution.request_body,
              contributor: {
                full_name: contribution.contributor.full_name,
                email: contribution.contributor.email
              },
              sent_at: contribution.request_sent_at
            };
            loadContributionRequest(contributionRequest, type, callback);
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
            $tables.find('tr[data-contribution-id="' + contribution.id + '"]')
                   .remove();
            // if this was the only contribution under a group, remove the group
            $tables.find('tr.group').each(function () {
              if ($(this).next().hasClass('group')) { $(this).remove(); }
            });
            // update app data
            app.contributions = app.contributions.filter(function (c) {
              return c.id == contribution.id;
            });
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
        showContributionRequest(contributionId, 'send');
      }

    })

    .on('click', '.contributor-actions .re-send-request', function () {
      var contributionId = $(this).closest('tr').data('contribution-id');

      if (missingCuratorInfo().length > 0) {
        flashDisplay("Can't send email because the following Curator fields are missing: "  +
          missingCuratorInfo().join(', '), 'danger');
        return false;

      } else {
        showContributionRequest(contributionId, 'send');
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
      showContributionRequest(contributionId, 'readonly');
    })

    .on('click', 'a[href="#contribution-content-modal"]', function () {

      var contributionId = $(this).closest('tr').data('contribution-id'),
          contribution = app.contributions.find(function (contribution) {
              return contribution.id == contributionId;
            }),
          template = _.template( $('#contribution-content-template').html() );

      $('#contribution-content-modal .modal-body').empty().append(
        template({ contribution: contribution })
      );

    })

    // keep link dialog modifications limited to contribution request
    .on('shown.bs.modal', '#contribution-request-modal', function () {
      $(document).on('shown.bs.modal', '.link-dialog', modifyLinkDialog);
    })
    .on('hidden.bs.modal', '#contribution-request-modal', function () {
      $(document).off('shown.bs.modal', '.link-dialog', modifyLinkDialog);
    });

}