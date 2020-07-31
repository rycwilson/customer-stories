
// import headerTemplate from './stories_header_template';
// import { actionsDropdownTemplate } from './stories_actions';

const columnIndices = {
  customer: 1,
  title: 2,
  status: 2,
  story: 5,
  actions: 6 

};

export default {
  headerTemplate,
  init(deferred) {
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
      order: [[columnIndices.customer, 'asc'], [columnIndices.success, 'desc']],
      columns: [
        {
          data: null,
          render: (data, type, row) => `
            <i class="fa fa-caret-right"></i><i class="fa fa-caret-down"></i>
          `
        },
        {
          name: 'success',
          data: {
            _: (row, type, set, meta) => {
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
            _: (row, type, set, meta) => {
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
            _: (row, type, set, meta) => {
              return { id: row.curator.id, name: row.curator.full_name };
            },
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
            _: (row, type, set, meta) => {
              return row.story && { id: row.story.id, title: row.story.title };
            }
          },
          defaultContent: 'false'
        },
        {
          data: 'display_status',
          render: (status, type, row, meta) => {
            return actionsDropdownTemplate(
              status,
              row.story,
              row.story && `/curate/${ row.customer.slug }/${ row.story.slug }`
            )
          }
        }
      ],
      columnDefs: [
        { 
          visible: false, 
          targets: [columnIndices.customer, columnIndices.curator, columnIndices.story] 
        },
        {
          targets: [0, columnIndices.actions],
          orderable: false,
          searchable: false,
          createdCell: (td, cellData, rowData, row, col) => {
            $(td).addClass(col === 0 ? 'toggle-child-row' : 'actions dropdown');
          }
        },
        { 
          width: '0%',  // hidden
          targets: [columnIndices.customer, columnIndices.curator, columnIndices] 
        },  
        { width: '5%', targets: 0 },
        { width: '61%', targets: columnIndices.success },
        { width: '26%', targets: columnIndices.status },
        { width: '8%', targets: columnIndices.actions }
      ],
      rowGroup: {
        dataSrc: 'customer.name',
        startRender: (groupRows, successName) => {
          // console.log(groupRows, successName)  
          const customerId = $('#successes-table')
                                .DataTable()
                                .rows(groupRows[0][0])
                                .data()[0]
                                .customer.id;
          return $('<tr/>').append(`
            <td colspan="3">
              <span style="font-weight:600">
                ${ groupRows.data()[0].customer.name }
              </span>
            </td>
            <td colspan="1">
              <button data-toggle="modal" data-target="#edit-customer-modal" 
                      data-customer-id="${ customerId }">
                  <i class="glyphicon glyphicon-pencil"></i>
              </button>
            </td>
          `);
        }
      },
      createdRow: (row, data, index) => {
        // TODO: try this
        /* $(row)
          .attr('data-customer-id', data.customer.id)
          .attr('data-success-id', data.id)
          .children()
            .eq(0).addClass('toggle-child-row').end()
            .eq(1).attr('data-filter', data.id).end()
            .eq(2).addClass('status').end()
            .eq(3).addClass('actions dropdown') */
        $(row).attr('data-customer-id', data.customer.id);
        $(row).attr('data-success-id', data.id);
        $(row).children().eq(0).addClass('toggle-child-row');
        $(row).children().eq(1).attr('data-filter', data.id);
        $(row).children().eq(2).addClass('status');
        $(row).children().eq(3).addClass('actions dropdown');
      },
      initComplete: function (settings, json) {
        const $table = $(this);
        const dt = $table.DataTable();
        const $tableWrapper = $table.closest('[id*="table_wrapper"]');
        
        // remove default search field.  Disabling via options also disables api, so can't do that
        $tableWrapper.children('.row:first-child').remove();
        
        // trigger curator select and show tables
        deferred.resolve();

        $('.working--prospect').addClass('successes-loaded');
        $tableWrapper.find('.dataTables_paginate').show();

        // $table.on('draw.dt', function (e) {
        //   console.log('draw')
        //   $tableWrapper.find('.dataTables_info')
        //                .addClass('help-block text-right')
        //                .appendTo($tableWrapper.find('.select-filters'));
        // });
      }
    });
  },
  remove(contributionId) {
    $('#successes-table')
      .DataTable()
      .row( $(`[data-success-id="${ successId }"]`) )
      .remove()
      .draw();

    // if this was the only success under a group, remove the group
    $('#successes-table')
      .find('tr.dtrg-group')
        .each((index, group) => {
          if ( $(group).next().hasClass('dtrg-group') ) $(group).remove();
        });
  }
}




