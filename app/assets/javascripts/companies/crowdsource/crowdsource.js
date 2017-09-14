
//= require ./filters
//= require ./new_contributor
//= require ./success_details
//= require ./success_actions
//= require ./contributor_details
//= require ./contributor_actions

function crowdsource () {

}

function crowdsourceListeners () {

  crowdsourceFiltersListeners();
  newContributorListeners();
  successDetailsListeners();
  successActionsListeners();
  contributorDetailsListeners();
  contributorActionsListeners();

  $(document)

    .on('click', '#crowdsource .layout-sidebar a', function () {
      Cookies.set('crowdsource-tab', $(this).attr('href'));
    })

    .on('click', 'td.crowdsourcing-template',
      function (e) {
        contributorsEditor.inline(this);
      })

    .on('click', '#crowdsource-contributors-table a.success',
      function (e) {
        var successId = $(this).closest('tr').next().data('success-id');
        $('a[href="#successes"]').tab('show');
        $('#successes-filter').val('success-' + successId).trigger('change');
      })

    .on('click', '#crowdsource-contributors-table td.email-template', function (e) {
      contributorsEditor.inline(this);
    })

    // no striping for grouped rows, yes striping for ungrouped
    // manipulate via jquery; insufficient to just change even/odd classes
    .on('change', '#toggle-group-by-customer, #toggle-group-by-success',
      function () {
        if ($(this).is('#toggle-group-by-success')) {
          toggleStriped($('#crowdsource-contributors-table'));
        } else {
          toggleStriped($('#successes-table'));
        }
      })

    // successes - order by customer grouping
    .on('click', '#successes-table tr.group',
      function () {
        var dt = $('#successes-table').DataTable(),
            currentOrder = dt.order()[0];
        if (currentOrder[0] === 1 && currentOrder[1] === 'asc') {
          dt.order([ 1, 'desc' ]).draw();
        }
        else {
          dt.order([ 1, 'asc' ]).draw();
        }
      })

    // contributors - order by success
    .on('click', '#crowdsource-contributors-table tr.group',
      function (e) {
        var dt = $('#crowdsource-contributors-table').DataTable(),
            successIndex = 2,
            currentOrder = dt.order()[0];
        if (! $(e.target).is('a') ) {
          if (currentOrder[0] === successIndex && currentOrder[1] === 'asc') {
            dt.order([ successIndex, 'desc' ]).draw();
          }
          else {
            dt.order([ successIndex, 'asc' ]).draw();
          }
        }
      })

    .on('shown.bs.dropdown', '.actions-dropdown',
      function () {
        $(this).closest('tr').addClass('active');
      })

    .on('hidden.bs.dropdown', '.actions-dropdown',
      function () {
        $(this).closest('tr').removeClass('active');
        // $(this).children().last().css('color', '#666');
      });

}

// manipulate table stripes when alternating between row grouping and no row grouping
function toggleStriped ($table) {

  $table.find('tr.group').toggle();
  $table.toggleClass('table-striped');

  if ( $table.hasClass('table-striped') ) {
    $table.find('tr:not(.group)')
      .each(function (index) {
        $(this).removeClass('even odd');
        $(this).addClass(index % 2 === 0 ? 'even' : 'odd');
        // reset the hover behavior, lest the new background color override bootstrap
        $(this).hover(
          function () { $(this).css('background-color', '#f5f5f5'); },
          function () {
            $(this).css('background-color', index % 2 === 0 ? '#fff' : '#f9f9f9');
          }
        );
      });
    $table.find('tr.even:not(.group)').css('background-color', '#fff');
    $table.find('tr.odd:not(.group)').css('background-color', '#f9f9f9');

  } else {
    $table.find('tr:not(.group)').css('background-color', '#fff');
    $table.find('tr:not(.group)')
      .each(function () {
        $(this).removeClass('even odd');
        // reset the hover behavior, lest the new background color override bootstrap
        $(this).hover(
          function () { $(this).css('background-color', '#f5f5f5'); },
          function () { $(this).css('background-color', '#fff'); }
        );
      });
  }
}