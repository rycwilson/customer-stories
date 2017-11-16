
function contributorDetailsListeners () {

  var contributionPath = function (contributionId) {
        return '/contributions/' + contributionId;
      },
      getContributor = function (contributionId) {
        return $.ajax({
                  url: contributionPath(contributionId),
                  method: 'get',
                  data: { get_contributor: true },
                  dataType: 'json'
                });
      };

  $(document)
    .on('click', 'td.contributor-details', function () {
      var $trContribution = $(this).closest('tr'),
          $trContributor, // child row
          $table = $trContribution.closest('table'),
          dtRow = $table.DataTable().row($trContribution),
          contribution = dtRow.data(),
          workflowStage = $table.attr('id').slice(0, $table.attr('id').indexOf('-'));

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $trContribution.children().last().css('color', '#666');
        $trContribution.find('td.contributor-name > span').removeClass('shown');
        $trContribution.removeClass('shown active');
      }
      else {
        $trContribution.find('td.contributor-name > span').addClass('shown');
        $trContribution.children().last().css('color', 'white');
        $trContribution.addClass('shown active');
        dtRow.child(
          _.template($('#contributor-details-template').html())({
            contributionPath: contributionPath(contribution.id),
            contribution: {},
            contributor: {},
            workflowStage: workflowStage
          })
        ).show();
        getContributor(contribution.id).done(function (contributor) {
          dtRow.child(
            _.template($('#contributor-details-template').html())({
              contributionPath: contributionPath(contribution.id),
              contribution: contribution,
              contributor: contributor,
              workflowStage: workflowStage
            })
          ).show();
          $trContributor = $trContribution.next();
          $trContributor.one('input change', function () {
            $(this).find('button[type="submit"]').prop('disabled', false);
          });
          $("input[type='tel']").inputmask("999-999-9999");
          if (contributor.linkedin_url) {
            loadCspOrPlaceholderWidget($trContributor, contributor);
            loadLinkedinWidget($trContributor, contributor);
          }
        });
      }
      $(this).children().toggle();  // toggle caret icons

    })

    .on('submit', '.contributor-form', function () {
      $(this).find('button[type="submit"] span').toggle();
      $(this).find('button[type="submit"] .fa-spinner').toggle();
    });
}

