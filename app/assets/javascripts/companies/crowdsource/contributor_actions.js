
function contributorActionsListeners () {

  var contributionPath = function (id) {
        return '/companies/' + app.company.id + '/contributions/' + id;
      },
      missingCuratorInfo = function () {
        return ['first_name', 'last_name', 'photo', 'phone', 'position']
          .filter(function (item) { return app.current_user[item] === '' ; });
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
        .done(function (data, status, xhr) {
          console.log(data, status, xhr);
        });
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