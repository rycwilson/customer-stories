
function initSuccessesTable (dtSuccessesInit) {

  var successIndex = 1, customerIndex = 2, curatorIndex = 3, statusIndex = 4, storyIndex = 5, actionsIndex = 6;

  $('#successes-table').DataTable({
    ajax: {
      url: '/successes',
      dataSrc: ''
    },
    autoWidth: false,
    dom: 'tip',
    pageLength: 100,
    language: {
      emptyTable: 'No Customer Wins found',
      zeroRecords: 'No Customer Wins found'
    },
    order: [[customerIndex, 'asc'], [successIndex, 'desc']],
    columns: [
      {
        data: null,
        render: function (data, type, row) {
          return "<i class='fa fa-caret-right'></i>" +
                 "<i class='fa fa-caret-down' style='display:none'></i>";
        }
      },
      {
        name: 'success',
        data: {
          _: function (row, type, set, meta) {
            // console.log(row)
            return {
              id: row.id,
              name: row.name,
              curatorId: row.curator.id,
              customerId: row.customer.id
            };
          },
          display: 'name',
          filter: 'name',
          sort: 'timestamp' // success.created_at
        },
      },
      {
        name: 'customer',
        data: {
          _: function (row, type, set, meta) {
            return { id: row.customer.id, name: row.customer.name };
          },
          display: 'customer.name',
          filter: 'customer.name',
          sort: 'customer.name'
        }
      },
      {  // curator
        name: 'curator',
        data: {
          _: 'curator.full_name',
          filter: 'curator.id'
        }
      },
      {
        name: 'status',
        data: {
          _: 'display_status',
        }
      },
      {
        name: 'story',
        data: {
          _: function (row, type, set, meta) {
            return row.story && { id: row.story.id, title: row.story.title };
          }
        },
        defaultContent: 'false'
      },
      {
        data: 'display_status',
        render: function (data, type, row, meta) {
            return _.template($('#success-actions-dropdown-template').html())({
                status: data,
                story: row.story,
                storyPath: row.story && '/curate/' + row.customer.slug + '/' + row.story.slug
              });
          }
      }
    ],
    columnDefs: [
      { visible: false, targets: [customerIndex, curatorIndex, storyIndex] },
      {
        targets: [0, actionsIndex],
        orderable: false,
        searchable: false,
        createdCell: function (td, cellData, rowData, row, col) {
          if (col === 0) {
            $(td).addClass('toggle-success-child');
          } else {
            $(td).addClass('actions dropdown');
          }
        }
      },
      { width: '0%', targets: [customerIndex, curatorIndex, storyIndex] },  // hidden
      { width: '5%', targets: 0 },
      { width: '61%', targets: successIndex },
      { width: '26%', targets: statusIndex },
      { width: '8%', targets: actionsIndex }
    ],
    rowGroup: {
      dataSrc: 'customer.name',
      startRender: function (groupRows, successName) {
        // console.log($(this))   //  [RowGroup]
        var customerId = $('#successes-table').DataTable()
                           .rows( groupRows[0][0] )
                           .data()[0]
                           .customer.id;
        return $('<tr/>').append(
          '<td colspan="3">' +
             '<span style="font-weight:600">' +
                groupRows.data()[0].customer.name +
             '</span>' +
          '</td>' +
          '<td colspan="1">' +
             '<button data-toggle="modal" data-target="#edit-customer-modal" data-customer-id="' + customerId + '">' +
                '<i class="glyphicon glyphicon-pencil"></i>' +
             '</button>' +
          '</td>'
        );
      }
    },
    createdRow: function (row, data, index) {
      $(row).attr('data-customer-id', data.customer.id);
      $(row).attr('data-success-id', data.id);
      $(row).children().eq(0).addClass('toggle-success-child');
      $(row).children().eq(1).attr('data-filter', data.id);
      $(row).children().eq(2).addClass('status');
      $(row).children().eq(3).addClass('actions dropdown');
    },
    initComplete: function (settings, json) {
      var $table = $(this), dt = $table.DataTable();
          $tableWrapper = $table.closest('[id*="table_wrapper"]');
      
      // remove default search field.  Disabling via options also disables api, so can't do that
      $tableWrapper.children('.row:first-child').remove();
      
      // trigger curator select and show tables
      dtSuccessesInit.resolve();

      // $table.on('draw.dt', function (e) {
      //   console.log('draw')
      //   $tableWrapper.find('.dataTables_info')
      //                .addClass('help-block text-right')
      //                .appendTo($tableWrapper.find('.select-filters'));
      // });
    }

  });
}