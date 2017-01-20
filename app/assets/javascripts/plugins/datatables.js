
function initDataTables () {

  $('#curate-table').DataTable();

  $('#measure-activity-table').DataTable({
    lengthMenu: [[-1, 10, 25, 50], ['All', 10, 25, 50]],
  });

  $('#story_views-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'date' }, null, null, null, null
    ]
  });
  $('#stories_published-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'date' }, null, null, null
    ]
  });
  $('#contributions_submitted-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'date' }, null, null, null
    ]
  });
  $('#contribution_requests_received-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'date' }, null, null, null
    ]
  });
  $('#stories_logo_published-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'date' }, null, null, null
    ]
  });
  $('#stories_created-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'date' }, null, null, null
    ]
  });

  $('#measure-visitors-table').DataTable({
    'order': [[0, 'asc']]  // order by total views
  //   // 'footerCallback': function (row, data, start, end, display) {
  //   //     var api = this.api();
  //   //     // Remove the formatting to get integer data for summation
  //   //     var intVal = function (i) {
  //   //                    return typeof i === 'string' ? i.replace(/[\$,]/g, '') * 1 :
  //   //                           typeof i === 'number' ? i :
  //   //                           0;
  //   //     };
  //   //     // Total over all pages
  //   //     visitor_total = api.column(0).data()
  //   //                                  .reduce(function (a, b) {
  //   //                                     return intVal(a) + intVal(b);
  //   //                                   }, 0 );

  //   //     // Total over this page
  //   //     // pageTotal = api
  //   //     //     .column( 4, { page: 'current'} )
  //   //     //     .data()
  //   //     //     .reduce( function (a, b) {
  //   //     //         return intVal(a) + intVal(b);
  //   //     //     }, 0 );

  //   //     // Update footer
  //   //     $(api.column(0).footer()).html('Total: ' + visitor_total);
  //   // }
  });

  $('#measure-stories-table').DataTable({
    'order': [[4, 'desc']]
  });

}