
function initDataTables () {

  $('#curate-table').DataTable();

  $('#measure-visitors-table').DataTable({
    'order': [[3, 'desc']]
  });

  $('#measure-stories-table').DataTable({
    'order': [[3, 'desc']]
  });

}