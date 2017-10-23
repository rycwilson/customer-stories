
//= require ./dt_successes
//= require ./dt_contributors
//= require ./dt_promoted_stories
//= require ./dt_editors

function initDataTables () {

  // make sure daterangepicker is initialized prior to datatables,
  // else the prior selected date range will be used instead of default
  if ($('#measure-visitors-container').hasClass('active')) {
    $('a[href="#measure-visitors-container"]')[0].click();
  }
  if ($('#measure-stories-container').hasClass('active')) {
    $('a[href="#measure-stories-container"]')[0].click();
  }

  // if curator signed in ...
  if (app.company) {

    var dtSuccessesInit = $.Deferred(),
        dtContributorsInit = $.Deferred(),
        showTables = function () {
          $('.successes-header, #successes-table, ' +
            '.contributors-header, #crowdsource-contributors-table')
            .css('visibility', 'visible');
        },
        initSelectFilters = function ($tableWrapper) {
          $tableWrapper.find('.curator-select')
            .select2({
              theme: 'bootstrap',
              width: 'style',
              minimumResultsForSearch: -1   // hides text input
            })
            // select2 is inserting an empty <option> for some reason
            .children('option').not('[value]').remove();
          $tableWrapper.find('.dt-filter').select2({
            theme: 'bootstrap',
            width: 'style',
            // allowClear: true
          });
          $tableWrapper.find('.curator-select')
            .val( app.current_user.id )
            .trigger( 'change', { auto: true } );
        },
        initCheckboxFilters = function () {
          $('#show-wins-with-story, #show-completed, #show-published')
            .trigger('change');
        };

    // the isDataTable() checks might come in handy
    // if ( !$.fn.dataTable.isDataTable($('#successes-table')) ) {
      initSuccessesTable(dtSuccessesInit);
    // }
    // if ( !$.fn.dataTable.isDataTable($('#crowdsource-contributors-table')) ) {
      initContributorsTable('crowdsource', dtContributorsInit);
    // }
    // if ( !$.fn.dataTable.isDataTable($('#curate-contributors-table')) ) {
      initContributorsTable('curate');
    // }
    // if ( !$.fn.dataTable.isDataTable($('#promoted-stories-table')) ) {
      initPromotedStoriesTable();
    // }

    $.when(dtSuccessesInit, dtContributorsInit)
      .done(function () {
        initSelectFilters( $('#successes-table').closest('[id*="table_wrapper"]') );
        initSelectFilters( $('#crowdsource-contributors-table').closest('[id*="table_wrapper"]') );
        initCheckboxFilters();
        showTables();
      });

  }

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
