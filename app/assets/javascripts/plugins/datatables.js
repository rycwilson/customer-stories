
function initDataTables () {


  // make sure daterangepicker is initialized prior to datatables,
  // else the prior selected date range will be used instead of default
  if ($('#measure-visitors-container').hasClass('active')) {
    $('a[href="#measure-visitors-container"]')[0].click();
  }
  if ($('#measure-stories-container').hasClass('active')) {
    $('a[href="#measure-stories-container"]')[0].click();
  }

  $('#customers-table').DataTable({
    paging: false,
    columnDefs: [
      { orderable: false, targets: [ 3 ] },
      { width: '160px', targets: 3 }
    ],
  });

  var $successes = $('#successes-table').DataTable({
    paging: false,
    order: [[ 1, 'asc' ]],
    columnDefs: [
      { visible: false, targets: [ 1 ] },
      { orderable: false, targets: [ 5 ] }
    ],
    drawCallback: function (settings) {
      var api = this.api();
      var rows = api.rows( { page:'current' } ).nodes();
      var last = null;
      api.column(1, { page: 'current' }).data().each(function (group, i) {
        if (last !== group) {
          $(rows).eq(i).before(
            '<tr class="group"><td colspan="5">' + group + '</td></tr>'
          );
          last = group;
        }
      });
    }
  });
  // Order by the grouping
  $('#successes-table tbody').on('click', 'tr.group', function () {
    var currentOrder = $successes.order()[0];
    if (currentOrder[0] === 1 && currentOrder[1] === 'asc') {
      $successes.order([ 1, 'desc' ]).draw();
    }
    else {
      $successes.order([ 1, 'asc' ]).draw();
    }
  });

  var $contributors = $('#contributors-table').DataTable({
    paging: false,
    order: [[ 2, 'asc' ]],
    columnDefs: [
      { visible: false, targets: [ 2 ] },
      { orderable: false, targets: [ 5 ] }
    ],
    drawCallback: function (settings) {
      var api = this.api();
      var rows = api.rows( { page:'current' } ).nodes();
      var last = null;
      api.column(2, { page: 'current' }).data().each(function (group, i) {
        if (last !== group) {
          $(rows).eq(i).before(
            '<tr class="group"><td colspan="5">' + group + '</td></tr>'
          );
          last = group;
        }
      });
    }
  });
  // Order by the grouping
  $('#contributors-table tbody').on('click', 'tr.group', function () {
    var currentOrder = $contributors.order()[0];
    if (currentOrder[0] === 2 && currentOrder[1] === 'asc') {
      $contributors.order([ 2, 'desc' ]).draw();
    }
    else {
      $contributors.order([ 2, 'asc' ]).draw();
    }
  });

  $('#curate-table').DataTable({
    paging: false
  });

  $('#sponsored-stories-table').DataTable({
    paging: false,
    columnDefs: [{
      orderable: false,
      targets: [ 2, 4 ]
    }]
  });

  // Don't specify first column as type: 'date'
  // with moment.js install, doing so will only screw it up
  $('#story_views-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null, null
    ]
  });
  $('#stories_published-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null
    ]
  });
  $('#contributions_submitted-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null
    ]
  });
  $('#contribution_requests_received-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null
    ]
  });
  $('#stories_logo_published-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null
    ]
  });
  $('#stories_created-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null
    ]
  });


}