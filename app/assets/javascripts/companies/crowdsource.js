
function crowdsourceListeners () {

  var _contributorTemplate = _.template($('#contributor-template').html());

  // successes - order by customer grouping
  $(document)
    .on('click', '#successes-table tr.group',
      function () {
        var $successes = $('#successes-table').DataTable(),
            currentOrder = $successes.order()[0];
        if (currentOrder[0] === 1 && currentOrder[1] === 'asc') {
          $successes.order([ 1, 'desc' ]).draw();
        }
        else {
          $successes.order([ 1, 'asc' ]).draw();
        }
      })

    // contributors - order by success
    .on('click', '#contributors-table tr.group',
      function (e) {
        var $contributors = $('#contributors-table').DataTable(),
            successIndex = 2,
            currentOrder = $contributors.order()[0];
        if (! $(e.target).is('a') ) {
          if (currentOrder[0] === successIndex && currentOrder[1] === 'asc') {
            $contributors.order([ successIndex, 'desc' ]).draw();
          }
          else {
            $contributors.order([ successIndex, 'asc' ]).draw();
          }
        }
      })

    // contributors child rows
    .on('click', '#contributors-table td.contributor-details',
      function () {
        var $table = $(this).closest('table').DataTable(),
            $tr = $(this).closest('tr'),
            $contribution = $table.row($tr);
        if ($contribution.child.isShown()) {
          $contribution.child.hide();
          $tr.children().last().css('color', '#666');
          $tr.removeClass('shown active');
        }
        else {
          $contribution.child( _contributorTemplate({ contributor: null }) ).show();
          $tr.children().last().css('color', 'white');
          $tr.addClass('shown active');
        }
        $(this).children().toggle();  // toggle caret icons
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