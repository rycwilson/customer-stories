
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
            '.contributors-header, #prospect-contributors-table')
            .css('visibility', 'visible');
        },
        renderTableHeaders = function () {
          var dtSuccesses = $('#successes-table').DataTable(),
              dtContributors = $('#prospect-contributors-table').DataTable(),
              curators = app.company.curators,
              contributors = _.uniq(
                dtContributors.column(1).data().toArray(), false,
                function (contributor, index) { return contributor.id; }
              ),
              successes = dtSuccesses.column(1).data().toArray(),
              customers = _.uniq(
                dtSuccesses.column(2).data().toArray(), false,
                function (customer, index) { return customer.id; }
              );
            $('#successes-table').closest('[id*="table_wrapper"]').prepend(
              _.template($('#successes-table-header-template').html())({
                curators: app.company.curators,
                successes: successes,
                customers: customers
              })
            );
            $('#prospect-contributors-table').closest('[id*="table_wrapper"]').prepend(
              _.template($('#contributors-table-header-template').html())({
                curators: app.company.curators,
                contributors: contributors,
                successes: successes,
                customers: customers
              })
            );
        },
        attachTableListeners = function () {
          // if no search results, prompt to search All Curators
          $('#successes-table, #prospect-contributors-table').on('draw.dt', function () {
            var $tableWrapper = $(this).closest('[id*="table_wrapper"]'),
                curatorId = $tableWrapper.find('.curator-select').val();
            if ($('td.dataTables_empty').length &&  // no records
                curatorId !== '0' &&               // curator is selected
                $('td.dataTables_empty').find('a').length === 0) {
              $('td.dataTables_empty').html(
                '<span style="line-height:25px">' + $('td.dataTables_empty').text() + '</span><br>' +
                '<span style="line-height:25px">Try searching <a href="javascript:;" class="all-curators">All Curators</a></span>'
              );
            }
          });
        },
        initSelectFilters = function ($tableWrapper) {
          $('.crowdsource.curator-select')
            .select2({
              theme: 'bootstrap',
              width: 'style',
              minimumResultsForSearch: -1   // hides text input
            })
            // select2 is inserting an empty <option> for some reason
            .children('option').not('[value]').remove();
          $('.dt-filter').select2({
            theme: 'bootstrap',
            width: 'style',
            // allowClear: true
          });
          $('.crowdsource.curator-select')
            .val(app.current_user.id)
            .trigger('change', { auto: true });
        },
        initCheckboxFilters = function () {
          $('#show-wins-with-story, #show-completed, #show-published')
            .trigger('change');
        };

    // the isDataTable() checks might come in handy
    // if ( !$.fn.dataTable.isDataTable($('#successes-table')) ) {
      initSuccessesTable(dtSuccessesInit);
    // }
    // if ( !$.fn.dataTable.isDataTable($('#prospect-contributors-table')) ) {
      initContributorsTable('prospect', dtContributorsInit);
    // }
    // if ( !$.fn.dataTable.isDataTable($('#curate-contributors-table')) ) {
      initContributorsTable('curate');
    // }
    // if ( !$.fn.dataTable.isDataTable($('#promoted-stories-table')) ) {
      initPromotedStoriesTable();
    // }

    $.when(dtSuccessesInit, dtContributorsInit)
      .done(function () {
        renderTableHeaders();
        attachTableListeners();
        initSelectFilters();
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
