
function contributorActionsListeners () {

  $(document)

    .on('click', '.send-request', function () {

      var missingCuratorInfo = function () {
              return ['first_name', 'last_name', 'photo', 'phone', 'position']
                .filter(function (item) { return app.current_user[item] === '' ; });
            };

      if (missingCuratorInfo().length > 0) {
        flashDisplay("Can't send email because the following Curator fields are missing: "  +
          missingCuratorInfo().join(', '), 'danger');
        return false;

      } else {

      }

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