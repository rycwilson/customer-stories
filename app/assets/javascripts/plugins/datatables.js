
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

  var customerIndex = 1, succColumnsCount = 6;
  $('#successes-table').DataTable({
    paging: false,
    order: [[ customerIndex, 'asc' ]],
    columnDefs: [
      { visible: false, targets: [ customerIndex ] },
      { orderable: false, targets: [ succColumnsCount - 1 ] }
    ],
    drawCallback: function (settings) {
      var api = this.api();
      var rows = api.rows( { page:'current' } ).nodes();
      var last = null;
      api.column(customerIndex, { page: 'current' }).data().each(function (group, i) {
        if (last !== group) {
          $(rows).eq(i).before(
            '<tr class="group"><td colspan="' + (succColumnsCount - 1).toString() + '">' + group + '</td></tr>'
          );
          last = group;
        }
      });
    }
  });

  var successIndex = 2, conColumnsCount = 6;
  $('#contributors-table').DataTable({
    paging: false,
    autoWidth: false,
    order: [[ successIndex, 'asc' ]],
    // columns: [ { width: '60px' }, null, null, null, null, null, null ],
    columnDefs: [
      { visible: false, targets: [ successIndex ] },
      { orderable: false, targets: [ 0, conColumnsCount - 1 ] },
      { width: '5%', targets: 0 },
      { width: '33%', targets: 1 },
      { width: '33%', targets: 2 },
      { width: '33%', targets: 3 },
      { width: '20%', targets: 4 },
      { width: '6%', targets: 5 }
    ],
    drawCallback: function (settings) {
      var api = this.api();
      var rows = api.rows( { page:'current' } ).nodes();
      var last = null;
      api.column(successIndex, { page: 'current' }).data().each(function (group, i) {
        if (last !== group) {
          $(rows).eq(i).before(
            '<tr class="group"><td colspan="' + (conColumnsCount - 1).toString() + '">' + group + '</td></tr>'
          );
          last = group;
        }
      });
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