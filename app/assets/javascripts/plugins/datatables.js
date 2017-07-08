
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
      { orderable: false, targets: [ 2 ] },
      { width: '160px', targets: 2 }
    ],
  });

  // curator index applies to both successes and contributors
  var sCuratorIndex = 4, sCustomerIndex = 2, sColCount = 6;
  $('#successes-table').DataTable({
    paging: true,
    pageLength: 100,
    lengthChange: false,
    order: [[ sCustomerIndex, 'asc' ]],
    columnDefs: [
      { visible: false, targets: [ sCustomerIndex, sCuratorIndex ] },
      { orderable: false, targets: [ 0, sColCount - 1 ] },
      { width: '5%', targets: 0 },
      { width: '50%', targets: 1 },
      { width: '0%', targets: 2 },  // customer
      { width: '35%', targets: 3 },
      { width: '0%', targets: 4 },  // curator
      { width: '10%', targets: 5 }
    ],
    drawCallback: function (settings) {
      var api = this.api();
      var rows = api.rows( { page:'current' } ).nodes();
      var last = null;
      // row grouping
      api.column(sCustomerIndex, { page: 'current' }).data().each(function (group, i) {
        if (last !== group) {
          // subtract hidden rows: customer, curator
          $(rows).eq(i).before(
            '<tr class="group" style="font-weight:600"><td colspan="' + (sColCount - 2).toString() + '">' + group + '</td></tr>'
          );
          last = group;
        }
      });
    },
    initComplete: function (settings, json) {
      var $tableWrapper = $('#successes-table_wrapper'),
          template = _.template( $('#successes-table-header-template').html() );

      // remove default search field.  Disabling via options also disables api, so can't do that
      $tableWrapper.children('.row:first-child').remove();

      $tableWrapper.prepend(
        template({
          currentUser: app.current_user,
          curators: app.company.curators,
          curatorCol: $(this).data('curator-col'),
          customers: app.company.customers,
          customerCol: $(this).data('customer-col'),
          successes: app.company.successes,
          successCol: $(this).data('success-col'),
          selectWidth: 250
        })
      );

      var $curatorSelect = $tableWrapper.find('.crowdsource-curator-select');
      $curatorSelect.select2({
        theme: 'bootstrap',
        width: 'style',
        minimumResultsForSearch: -1   // hides text input
      });
      // select2 is inserting an empty <option> for some reason
      $curatorSelect.children('option').not('[value]').remove();
      $('#successes-filter').select2({
        theme: 'bootstrap',
        width: 'style'
        // allowClear: true
      });
      $(this).css('visibility', 'visible');
    }
  });

  initContributorsTable('crowdsource');

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

function initContributorsTable (workflowState) {
  var cCuratorIndex = 4, cCustomerIndex = 5, cSuccessIndex = 2, cColCount = 8;
  $('[id="' + workflowState + '-contributors-table"]').DataTable({
    paging: false,
    autoWidth: false,
    order: [[ cSuccessIndex, 'asc' ]],
    columnDefs: [
      { visible: false, targets: [ cSuccessIndex, cCuratorIndex, cCustomerIndex ] },
      { orderable: false, targets: [ 0, cColCount - 1 ] },
      { width: '5%', targets: 0 },
      { width: '30%', targets: 1 },
      { width: '0%', targets: 2 },  // success
      { width: '30%', targets: 3 },
      { width: '0%', targets: 4 },  // curator
      { width: '0%', targets: 5 },  // customer
      { width: '25%', targets: 6 },
      { width: '10%', targets: 7 }
    ],
    drawCallback: function (settings) {
      var api = this.api();
      var rows = api.rows( { page:'current' } ).nodes();
      var last = null;
      api.column(cSuccessIndex, { page: 'current' }).data().each(function (group, i) {
        if (last !== group) {
          // subtract hidden rows: success, curator, customer
          $(rows).eq(i).before(
            '<tr class="group"><td colspan="' + (cColCount - 3).toString() + '">' + group + '</td></tr>'
          );
          last = group;
        }
      });
    },
    initComplete: function (settings, json) {
      var $tableWrapper = $(this).closest('[id*="table_wrapper"]'),
          template = _.template($('#contributors-table-header-template').html());

      // remove default search field.  Disabling via options also disables api, so can't do that
      $tableWrapper.children('.row:first-child').remove();

      // contributors under a Story don't have curator and filter selects
      if (workflowState === 'crowdsource') {
        $tableWrapper.prepend(
          template({
            currentUser: app.current_user,
            workflowState: workflowState,
            curators: app.company.curators,
            curatorCol: $(this).data('curator-col'),
            successes: app.company.customers.successes,
            successCol: $(this).data('success-col'),
            customers: app.company.customers,
            customerCol: $(this).data('customer-col'),
            selectWidth: 250
          })
        );
        $tableWrapper.find('.curator-select').select2({
          theme: 'bootstrap',
          width: 'style',
          minimumResultsForSearch: -1   // hides text input
        });
        // select2 is inserting an empty <option> for some reason
        $tableWrapper.find('.curator-select > option').not('[value]').remove();
        $tableWrapper.find('.contributors-filter').select2({
          theme: 'bootstrap',
          width: 'style'
          // placeholder: 'type or select'
          // allowClear: true
        });
      }
      $(this).css('visibility', 'visible');
    }
  });
}