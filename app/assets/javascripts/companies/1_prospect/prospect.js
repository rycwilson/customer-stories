
//= require ./filters
//= require ./new_success
//= require ./new_contributor
//= require ./success_details
//= require ./success_actions
//= require ./contributor_details
//= require ./contributor_actions
//= require ./linkedin_util

function prospect () {

}

function prospectListeners () {

  prospectFiltersListeners();
  newSuccessListeners();
  newContributorListeners();
  successDetailsListeners();
  successActionsListeners();
  contributorDetailsListeners();
  contributorActionsListeners();

  $(document)

    .on('click', '#prospect .layout-sidebar a', function () {
      Cookies.set('prospect-tab', $(this).attr('href'));
    })

    .on('click', '#prospect-contributors-table tr.group a.story', function () {
      Cookies.set('csp-curate-story', 'settings');
    })

    // the close event happens shortly after blur; to ensure smooth transition...
    .on('blur', 'td.crowdsourcing-template', function () {
      var $td = $(this), editor;
      if ( $td.closest('table').is('#prospect-contributors-table') ) {
        editor = prospectContributorsEditor;
      } else {
        editor = curateContributorsEditor;
      }
      editor.one('close', function () {
        $td.removeClass('editor-open');
      });
    })

    .on('click', 'td.crowdsourcing-template', function (e) {
      var $row = $(this).parent(),
          workflowStage = $(this).closest('table').attr('id').match(/^(\w+)\-/)[1];
      // don't allow template change if request already sent (or re-sent)
      // (see createdRow property of datatables config)
      if ( $(this).hasClass('disabled') ) { return false; }
      $(this).addClass('editor-open');  // styling adjustment
      if (workflowStage === 'prospect') {
        openContributorsEditor(prospectContributorsEditor, $row);
      } else {
        openContributorsEditor(curateContributorsEditor, $row);
      }
    })

    .on('click', '#prospect-contributors-table a.success', function (e) {
      var successId = $(this).closest('tr').next().data('success-id');
      $('a[href="#successes"]').tab('show');
      $('#successes-filter').val('success-' + successId).trigger('change');
    })

    // no striping for grouped rows, yes striping for ungrouped
    // manipulate via jquery; insufficient to just change even/odd classes
    .on('change', '#toggle-group-by-customer, #toggle-group-by-success',
      function () {
        if ($(this).is('#toggle-group-by-success')) {
          toggleStriped($('#prospect-contributors-table'));
        } else {
          toggleStriped($('#successes-table'));
        }
      })

    // successes - order by customer grouping
    .on('click', '#successes-table tr.group', function () {
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
    .on('click', '#prospect-contributors-table tr.group', function (e) {
        var dt = $('#prospect-contributors-table').DataTable(),
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

    // https://www.gyrocode.com/articles/jquery-datatables-column-width-issues-with-bootstrap-tabs/
    .on('shown.bs.tab', '#prospect a[data-toggle="tab"]', function(e) {
         $($.fn.dataTable.tables(true)).DataTable()
            .columns.adjust();
      })

    // close a child row
    .on('click', 'div.success-details button[type="reset"], ' +
                 'div.contributor-details button[type="reset"]', function () {
        $(this).closest('tr').prev().find('td[class*="details"]').trigger('click');
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