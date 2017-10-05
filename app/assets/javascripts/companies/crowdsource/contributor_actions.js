
function contributorActionsListeners () {

  var contributionRequest,  // { contributor: ..., subject: ..., body: ... }
      $contributionRequestModal = $('#contribution-request-modal'),
      // things go haywire if a different selector is used, e.g. $('textarea')
      $contributionRequestEditor = $contributionRequestModal
                                     .find("[data-provider='summernote']"),
      $contributionContentModal = $('#contribution-content-modal'),
      contributionPath = function (id) {
        return '/companies/' + app.company.id + '/contributions/' + id;
      },
      missingCuratorInfo = function () {
        return ['first_name', 'last_name', 'photo', 'phone', 'position']
          .filter(function (item) { return app.current_user[item] === '' ; });
      },
      populateContributionRequestModal = function (contributionRequest) {
        $contributionRequestModal.find('form')
          .attr('action', contributionPath(contributionRequest.id));
        $contributionRequestModal.find('#request-recipient')
          .html(
            contributionRequest.contributor.full_name + '&nbsp;&nbsp;' +
            '&lt' + contributionRequest.contributor.email + '&gt'
          );
        $contributionRequestModal.find('[name="contribution[request_subject]"]')
          .val(contributionRequest.subject);
        $contributionRequestEditor.summernote('code', contributionRequest.body);
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
              }
            };
            populateContributionRequestModal(contributionRequest);
            $contributionRequestModal.modal('show');
          });
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