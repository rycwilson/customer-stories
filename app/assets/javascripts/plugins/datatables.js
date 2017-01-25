
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

  $('#measure-stories-table').DataTable({
    paging: false,
    info: false,
    order: [[3, 'desc']]
  });

}