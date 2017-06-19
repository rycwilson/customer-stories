
function crowdsourceListeners () {

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
        var table = $(this).closest('table').DataTable();
        var tr = $(this).closest('tr');
        var row = table.row(tr);
        if (row.child.isShown()) {
          row.child.hide();
          tr.removeClass('shown');
        }
        else {
          row.child( contributorDetails(row.data()) ).show();
          tr.addClass('shown');
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
      });

}

function contributorDetails (d) {
  return '<div class="container-fluid">' +
         '<div class="row" style="height:60px">' +
           '<div class="col-sm-6" style="height:100%;background:red"></div>' +
           '<div class="col-sm-6" style="height:100%;background:green"></div>' +
         '</div>' +
         '</div>';
  // return '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">'+
  //     '<tr>'+
  //         '<td>Full name:</td>'+
  //         '<td>'+d.name+'</td>'+
  //     '</tr>'+
  //     '<tr>'+
  //         '<td>Extension number:</td>'+
  //         '<td>'+d.extn+'</td>'+
  //     '</tr>'+
  //     '<tr>'+
  //         '<td>Extra info:</td>'+
  //         '<td>And any further details here (images etc)...</td>'+
  //     '</tr>'+
  // '</table>';
}