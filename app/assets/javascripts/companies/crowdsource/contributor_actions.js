
function contributorActionsListeners () {

  var contributionRequest,  // { contributor: ..., subject: ..., body: ... }
      $contributionRequestModal = $('#contribution-request-modal'),
      // things go haywire if a different selector is used, e.g. $('textarea')
      $contributionRequestEditor = $contributionRequestModal
                                     .find("[data-provider='summernote']"),
      $contributionContentModal = $('#contribution-content-modal'),
      contributionPath = function (contributionId) {
        return '/companies/' + app.company.id + '/contributions/' + contributionId;
      },
      missingCuratorInfo = function () {
        return ['first_name', 'last_name', 'photo', 'phone', 'position']
          .filter(function (item) { return app.current_user[item] === '' ; });
      },
      // type is 'send' or 'readonly'
      populateContributionRequest = function (contributionRequest, type) {
        var formattedDate = function (date) {
              return moment(date).calendar(null, {
                sameDay: '[today]',
                lastDay: '[yesterday]',
                lastWeek: '['+ moment(date).fromNow() +']',
                sameElse: 'M/DD/YY'
              }).split('at')[0];
            };

        // send or readonly
        $contributionRequestModal.find('.modal-content').addClass(type);
        if (type === 'send') {
          $contributionRequestModal.find('.modal-content').removeClass('readonly');
        } else {
          $contributionRequestModal.find('.modal-content').removeClass('send');
        }
        // set the readonly title (null is ok; formattedDate returns "Invalid")
        $contributionRequestModal.find('.readonly.modal-title span:last-child')
          .text(formattedDate(contributionRequest.sent_at));
        // set the path
        $contributionRequestModal.find('form')
          .attr('action', contributionPath(contributionRequest.id));
        // recipient
        $contributionRequestModal.find('#request-recipient').html(
          contributionRequest.contributor.full_name + '&nbsp;&nbsp;' +
          '&lt' + contributionRequest.contributor.email + '&gt'
        );
        // request subject
        $contributionRequestModal.find('[name="contribution[request_subject]"]')
          .val(contributionRequest.subject)
          .attr('readonly', type === 'readonly' ? true : false);
        // request body
        $contributionRequestEditor.summernote('code', contributionRequest.body);
        // enable or disable editor
        $contributionRequestEditor.summernote(
          type === 'readonly' ? 'disable' : 'enable'
        );

      },
      showContributionRequest = function (contributionId, type) {
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
            populateContributionRequest(contributionRequest, type);
            $contributionRequestModal.modal('show');
          });
      },
      toggleEmailProgress = function (state) {
        if (state === 'on') {
          $contributionRequestModal.find('.modal-title').addClass('hidden');
          $contributionRequestModal.find('.progress').removeClass('hidden');
        } else {
          $contributionRequestModal.find('.modal-title').removeClass('hidden');
          $contributionRequestModal.find('.progress').addClass('hidden');
        }
      };

  $(document)

    .on('click', '.send-request', function () {
      var contributionId = $(this).closest('tr').data('contribution-id');

      if (missingCuratorInfo().length > 0) {
        flashDisplay("Can't send email because the following Curator fields are missing: "  +
          missingCuratorInfo().join(', '), 'danger');
        return false;

      } else {
        showContributionRequest(contributionId, 'send');
      }

    })

    .on('click', '.re-send-request', function () {
      var contributionId = $(this).closest('tr').data('contribution-id');

      if (missingCuratorInfo().length > 0) {
        flashDisplay("Can't send email because the following Curator fields are missing: "  +
          missingCuratorInfo().join(', '), 'danger');
        return false;

      } else {
        showContributionRequest(contributionId, 'send');
      }

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

    .on('click', '.view-request', function () {
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

    });

}