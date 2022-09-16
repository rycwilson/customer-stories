
//= require ./dt_successes
//= require ./dt_contributors
//= require ./dt_promoted_stories
//= require ./dt_editors

function initDataTables (isBatch) {

  // https://github.com/DataTables/Responsive/issues/40
  $(document).on(
    'shown.bs.tab', 
    'a[href="#successes"], a[href*="contributors"], a[href="promoted-stories"]', 
    function () {
      $( $.fn.dataTable.tables(true) ).css('width', '100%');
      $( $.fn.dataTable.tables(true) ).DataTable().columns.adjust().draw();
    }
  )

  // make sure daterangepicker is initialized prior to datatables,
  // else the prior selected date range will be used instead of default
  if ($('#measure-visitors-container').hasClass('active')) {
    $('a[href="#measure-visitors-container"]')[0].click();
  }
  if ($('#measure-stories-container').hasClass('active')) {
    $('a[href="#measure-stories-container"]')[0].click();
  }

  // if curator signed in ...
  if (CSP.company) {

    var dtSuccessesInit = $.Deferred(),
        dtContributorsInit = $.Deferred(),
        showTables = function () {
          $('.successes-header, #successes-table, .contributors-header, #prospect-contributors-table')
            .css('visibility', 'visible');
          $('#prospect, #curate').find('.layout-sidebar .nav .btn-add').show();
        },
        renderTableHeaders = function () {
          var dtSuccesses = $('#successes-table').DataTable(),
              $successesWrapper = $('#successes-table').closest('[id*="table_wrapper"]'),
              dtContributors = $('#prospect-contributors-table').DataTable(),
              $contributorsWrapper = $('#prospect-contributors-table').closest('[id*="table_wrapper"]'),
              curators = CSP.company.curators,
              contributors = _.uniq(
                dtContributors.column(1).data().toArray(), false,
                function (contributor, index) { return contributor.id; }
              ),
              successes = dtSuccesses.column(1).data().toArray(),
              customers = _.uniq(
                dtSuccesses.column(2).data().toArray(), false,
                function (customer, index) { return customer.id; }
              );
          $successesWrapper.prepend(
            _.template($('#successes-table-header-template').html())({
              curators: CSP.company.curators,
              successes: successes,
              customers: customers
            })
          );
          $contributorsWrapper.prepend(
            _.template($('#contributors-table-header-template').html())({
              curators: CSP.company.curators,
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
                curatorId = $tableWrapper.find('.curator-select').val(),
                mesg = $(this).find('td.dataTables_empty').text(),
                timer;

            // need a timer as there are multiple draw events that occur in quick succession
            clearTimeout(timer);
            timer = setTimeout(function () {
              if ($tableWrapper.find('td.dataTables_empty').length &&  // no records
                  curatorId !== '' &&               // curator is selected
                  $tableWrapper.find('td.dataTables_empty a').length === 0) {
                $tableWrapper.find('td.dataTables_empty').html(
                  '<span style="line-height:25px">' + mesg + '</span><br>' +
                  '<span style="line-height:25px">Try searching <a href="javascript:;" class="all-curators">All Curators</a></span>'
                );
              }
            }, 1);

            $tableWrapper
              .find('.select-filters')
                .find('.dataTables_info')
                  .remove()
                  .end()
                .append(
                  $tableWrapper.children('.dataTables_info')
                                 .clone()
                                 .addClass('help-block text-right')
                                 .text(function () {
                                   return $(this).text().replace(/\sentries/g, '');
                                 })
                );
          });
        },
        initSelectFilters = function () {
          $('.prospect.curator-select')
            .select2({
              theme: 'bootstrap',
              width: 'style',
              placeholder: 'Select',
              allowClear: true,
              minimumResultsForSearch: -1   // hides search field
            })
            .on('select2:unselecting', function (e) {
              $(this).data('unselecting', true);
            })
            .on('select2:open', function (e) {
              if ($(this).data('unselecting')) {
                $(this).removeData('unselecting')
                       .select2('close');
              }
            })
            .on('change.select2', function (e) {
              if ($(this).val()) {
                $(this).next('.select2').addClass('select2-container--allow-clear')
              } else {
                $(this).next('.select2').removeClass('select2-container--allow-clear')
              }
            });

            // select2 is inserting an empty <option> for some reason
            // .children('option').not('[value]').remove();

          $('.dt-filter')
            .select2({
              theme: 'bootstrap',
              width: 'style',
              placeholder: 'Search / Select',
              allowClear: true
            })
            .on('select2:unselecting', function (e) {
              $(this).data('unselecting', true);
            })
            .on('select2:open', function (e) {
              if ($(this).data('unselecting')) {
                $(this).removeData('unselecting')
                       .select2('close');
              }
            })
            .on('change.select2', function (e) {
              if ($(this).val()) {
                $(this).next('.select2').addClass('select2-container--allow-clear')
              } else {
                $(this).next('.select2').removeClass('select2-container--allow-clear')
              }
            });

          $('.prospect.curator-select')
            .val(isBatch ? '' : CSP.current_user.id)
            .trigger('change', { auto: true });

          // [$('#successes-table_wrapper'), $('#prospect-contributors-table_wrapper')]
          //   .forEach(function ($wrapper) {
          //     $wrapper
          //       .find('.select-filters')
          //         .append(
          //           $wrapper.find('.dataTables_info')
          //                     .clone()
          //                     .addClass('help-block text-right')
          //         );
          //   });
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
