
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
      var $tr = $(this).closest('tr'),
          $table = $tr.closest('table'),
          dtRow = $table.DataTable().row($tr),
          contribution = dtRow.data(),
          workflowStage = $table.attr('id').slice(0, $table.attr('id').indexOf('-'));

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $tr.children().last().css('color', '#666');
        $tr.find('td.contributor-name > span').removeClass('shown');
        $tr.removeClass('shown active');
      }
      else {
        $tr.find('td.contributor-name > span').addClass('shown');
        $tr.children().last().css('color', 'white');
        $tr.addClass('shown active');
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
          $tr.next().one('input, change', function (e) {
            $(this).find('button[type="submit"]').prop('disabled', false);
          });
          $("input[type='tel']").inputmask("999-999-9999");
          if (contributor.linkedin_url) {
            loadCspOrPlaceholderWidget($tr.next(), contributor);
            loadLinkedinWidget($tr.next(), contributor);
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

