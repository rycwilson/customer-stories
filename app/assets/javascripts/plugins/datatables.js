
function initDataTables () {

  $('#measure-activity-table [data-toggle="toggle"]').change(function () {
    $(this).closest('tbody').next().toggle();
  });

  $('#curate-table').DataTable();

  $('#measure-activity-table').DataTable({
    lengthMenu: [[-1, 10, 25, 50], ['All', 10, 25, 50]],
  //   // order: [[3, ['Story views','Stories created','Logos published','Stories published','Contributions submitted','Contribution requests received']],[0,'desc']],
  //   // 'columnDefs': [
  //   //   { targets: [3], visible: false }
  //   // ],
  //   // drawCallback: function (settings) {
  //   //     var api = this.api();
  //   //     var rows = api.rows({ page:'current' }).nodes();
  //   //     var last = null;

  //   //     api.column(3, { page: 'current' }).data().each(function (group, i) {
  //   //       if (last !== group) {
  //   //         $(rows).eq(i).before(
  //   //           '<tr class="group"><td colspan="3">' + group + '</td></tr>'
  //   //         );
  //   //         last = group;
  //   //       }
  //   //     });
  //   // }
  });


  $('#measure-visitors-table').DataTable({
    'order': [[3, 'desc']]  // order by total views
    // 'footerCallback': function (row, data, start, end, display) {
    //     var api = this.api();
    //     // Remove the formatting to get integer data for summation
    //     var intVal = function (i) {
    //                    return typeof i === 'string' ? i.replace(/[\$,]/g, '') * 1 :
    //                           typeof i === 'number' ? i :
    //                           0;
    //     };
    //     // Total over all pages
    //     visitor_total = api.column(0).data()
    //                                  .reduce(function (a, b) {
    //                                     return intVal(a) + intVal(b);
    //                                   }, 0 );

    //     // Total over this page
    //     // pageTotal = api
    //     //     .column( 4, { page: 'current'} )
    //     //     .data()
    //     //     .reduce( function (a, b) {
    //     //         return intVal(a) + intVal(b);
    //     //     }, 0 );

    //     // Update footer
    //     $(api.column(0).footer()).html('Total: ' + visitor_total);
    // }
  });

  $('#measure-stories-table').DataTable({
    'order': [[4, 'desc']]
  });

}