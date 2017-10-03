
function contributorActionsListeners () {

  $(document)

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