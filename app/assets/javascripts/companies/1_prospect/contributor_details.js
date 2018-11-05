
function contributorDetailsListeners () {

  var contributionPath = function (contributionId) {
        return '/contributions/' + contributionId;
      },
      getContributor = function (contributionId) {
        return $.ajax({
                  url: contributionPath(contributionId),
                  method: 'GET',
                  data: {
                    get_contributor: true
                  },
                  dataType: 'json'
                });
      };

  $(document)
    .on('click', 'td.contributor-details', function () {
      var $table = $(this).closest('table'),
          $trContribution = $(this).closest('tr'),
          $trContributor, // child row
          dt = $table.DataTable(),
          dtRow = dt.row($trContribution),
          contribution = dtRow.data(),
          workflowStage = $table.attr('id').slice(0, $table.attr('id').indexOf('-'));
          console.log(contribution)
      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $trContribution.find('td.contributor-name > span').removeClass('shown');
        $trContribution.removeClass('shown active');
      } else {
        dtRow.child(
          _.template($('#contributor-details-template').html())({
            contributionPath: contributionPath(contribution.id),
            contribution: contribution,
            contributor: contribution.contributor,
            workflowStage: workflowStage
          })
        ).show();
        $trContribution.find('td.contributor-name > span').addClass('shown');
        $trContribution.addClass('shown active');
        $trContributor = $trContribution.next();

        // close other open child rows
        $table.find('tr[data-contribution-id]').not($trContribution).each(function () {
          if (dt.row($(this)).child.isShown()) {
            dt.row($(this)).child.hide();
            $(this).removeClass('shown active');
            $(this).children('td.contributor-details').children().toggle();
          }
        });

        // scroll to center
        window.scrollTo(0, $trContribution.offset().top - (window.innerHeight / 2) + (($trContributor.outerHeight() + $trContribution.outerHeight()) / 2));

        // $trContribution.children().last().css('color', 'white');
        getContributor(contribution.id).done(function (contributor) {
          if (contributor.linkedin_url) {
            // loadCspOrPlaceholderWidget($trContributor, contributor);
            loadLinkedinWidget($trContributor, contributor);
          }

          // enable save button on input or change
          $trContributor.one('input change', function () {
            $(this).find('button[type="submit"]').prop('disabled', false);
          });
          $("input[type='tel']").inputmask("999-999-9999");
        });
      }
      $(this).children().toggle();  // toggle caret icons
    });

}

