
function initSuccessesTable () {
  var customerIndex = 2, curatorIndex = 4, colCount = 6;
  $('#successes-table').DataTable({
    ajax: {
      url: '/successes',
      dataSrc: ''
    },
    dom: 'tip',
    pageLength: 100,
    language: {
      emptyTable: 'No Story Candidates found',
      zeroRecords: 'No Story Candidates found'
    },
    order: [[ customerIndex, 'asc' ]],
    columns: [
      { // td.success-details
        data: null,
        render: function (data, type, row) {
                  return "<i class='fa fa-caret-right'></i>" +
                         "<i class='fa fa-caret-down' style='display:none'></i>";
                }
      },
      {  // success
        name: 'success',
        data: 'name'
      },
      {  // customer
        name: 'customer',
        data: 'customer.name'
      },
      {  // next step
        render: function () {
          return '<span>Next step</span>';
        }
      },
      {  // curator
        name: 'curator',
        data: {
          _: 'curator.full_name',
          filter: 'curator.id'
        }
      },
      {  // td.dropdown.actions-dropdown
        data: 'contributions_count',
        render: function (data, type, row, meta) {
                  return _.template(
                            $('#successes-dropdown-template').html()
                          )({ contributionsCount: data });
                }
      }
    ],
    columnDefs: [
      { visible: false, targets: [customerIndex, curatorIndex] },
      {
        targets: [0, colCount - 1],
        orderable: false,
        searchable: false,
        createdCell: function (td, cellData, rowData, row, col) {
          if (col === 0) {
            $(td).addClass('success-details');
          } else {
            $(td).addClass('dropdown actions-dropdown');
          }
        }
      },
      { width: '0%', targets: [2, 4] },  // customer, curator
      { width: '5%', targets: 0 },
      { width: '50%', targets: 1 },
      { width: '35%', targets: 3 },
      { width: '10%', targets: 5 }
    ],
    rowGroup: {
      dataSrc: 'customer.name',
      startRender: function (groupRows, successName) {
        // console.log($(this))   //  [RowGroup]
        return $('<tr/>').append(
                  '<td colspan="4">' +
                     '<span style="font-weight:600">' +
                        groupRows.data()[0].customer.name +
                     '</span>' +
                  '</td>');
      }
    },
    createdRow: function (row, data, index) {
      $(row).attr('data-customer-id', data.customer.id);
      $(row).attr('data-success-id', data.id);
    },
    // drawCallback: function (settings) {
    // },
    initComplete: function (settings, json) {
      var $tableWrapper = $(this).closest('[id*="table_wrapper"]'),
          template = _.template( $('#successes-table-header-template').html() );

      // remove default search field.  Disabling via options also disables api, so can't do that
      $tableWrapper.children('.row:first-child').remove();

      $tableWrapper.prepend(
        template({
          currentUser: app.current_user,
          curators: app.company.curators,
          customers: app.company.customers,
          successes: app.company.successes,
          selectWidth: 250
        })
      );

      var $curatorSelect = $tableWrapper.find('.curator-select');
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

      $curatorSelect.val( app.current_user.id.toString() )
          .trigger('change', { auto: true });

      // $('#crowdsource a[href="#successes"]').find('.fa-spinner').hide();
      $(this).css('visibility', 'visible');
    }
  });
}