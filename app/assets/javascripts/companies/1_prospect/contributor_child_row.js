
function contributorChildRowListeners () {

  var contributionPath = function (contributionId) {
        return '/contributions/' + contributionId;
      },
      LI2Observer = function ($badge) {
        if ($badge.length === 0) return null;
        var $container = $badge.closest('.LI-profile__container'),
            timeoutId = setTimeout(function () {
              $container.addClass('error')
            }, 3000);
        new ResizeSensor($badge, function() {
          clearTimeout(timeoutId);
          $container.addClass('loaded');
        });
        initLinkedIn();
      }

  $(document)
    .on('click', '[id*="contributors-table"] td.toggle-nested-row', function () {
      var $table = $(this).closest('table'),
          $trContribution = $(this).closest('tr'),
          $trContributor, // child row
          dt = $table.DataTable(),
          dtRow = dt.row($trContribution),
          contribution = dtRow.data(),
          workflowStage = $table.attr('id').slice(0, $table.attr('id').indexOf('-'));

      $(this).children().toggle();  // toggle caret icons

      if (dtRow.child.isShown()) {
        dtRow.child.hide();
        $trContribution.find('td.contributor-name > span').removeClass('shown');
        $trContribution.removeClass('shown active');
        // dt.draw();
      } else {
        dtRow.child(
          _.template($('#contributor-child-row-template').html())({
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
            $(this).children('td.contributor-child-toggle').children().toggle();
          }
        });

        // scroll to center
        window.scrollTo(0, $trContribution.offset().top - (window.innerHeight / 2) + (($trContributor.outerHeight() + $trContribution.outerHeight()) / 2));

        // handle LI profile badge
        LI2Observer($trContributor.find('.LI-profile-badge'));

        // enable save button on input or change
        $trContributor.one('input change', function () {
          $(this).find('button[type="submit"]').prop('disabled', false);
        });
        // $("input[type='tel']").inputmask("999-999-9999");
      }
    })

}

