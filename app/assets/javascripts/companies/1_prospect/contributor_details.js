
function contributorDetailsListeners () {

  $(document)
    .on('click', 'td.contributor-details', function () {

      var $table = $(this).closest('table'),
          dt = $table.DataTable(),
          $tr = $(this).closest('tr'),
          dtRow = dt.row($tr),
          workflowStage = $table.attr('id').slice(0, $table.attr('id').indexOf('-')),
          contributionId = $tr.data('contribution-id'),
          contributionPath = '/contributions/' + contributionId,
          contribution = app.contributions.find(function (c) {
            return c.id === contributionId;
          });

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $tr.children().last().css('color', '#666');
        $tr.find('td.contributor-name > span').removeClass('shown');
        $tr.removeClass('shown active');
      }
      else {
        dtRow.child(
          _.template($('#contributor-details-template').html())({
            contribution: contribution,
            contributionPath: contributionPath,
            workflowStage: workflowStage
          })
        ).show();
        $tr.next().one('input', function (e) {
          $(this).find('button[type="submit"]').prop('disabled', false);
        });
        $tr.children().last().css('color', 'white');
        $("input[type='tel']").inputmask("999-999-9999");
        $tr.find('td.contributor-name > span').addClass('shown');
        if (contribution.contributor.linkedin_url) {
          loadCspOrPlaceholderWidget($tr.next(), contribution);
          loadLinkedinWidget($tr.next(), contribution);
        }
        $tr.addClass('shown active');
      }
      $(this).children().toggle();  // toggle caret icons

    })

    .on('submit', '.contributor-form', function () {
      $(this).find('button[type="submit"] span').toggle();
      $(this).find('button[type="submit"] .fa-spinner').toggle();
    });
}

