import { initTableControls, cloneFilterResults, toggleRowGroups, redrawRowGroups } from '../dashboard/tables.js';
import { actionsDropdownTemplate, showContributions, confirmDelete as deleteCustomerWin } from './actions.js';

let tableControls, tableWrapper, table, dt;

export default {
  init(successes) {
    console.log('init customer wins', successes)
    table = document.getElementById('successes-table');
    dt = initDataTable(successes);
  },
  addListeners() {
    document.addEventListener('change', (e) => {
      if (e.target.id === 'group-by-customer') toggleRowGroups(table);
    })
    document.addEventListener('click', (e) => { 
      const isAction = e.target.closest('.actions.dropdown > ul') && e.target.role !== 'separator';
      if (isAction) handleAction(e); 
    });
  }
}

function initDataTable(successes) {
  const colIndices = { success: 1, customer: 2, curator: 3, status: 4, story: 5, actions: 6 };
  return new DataTable(table, {
    // ajax: {
    //   url: '/successes',
    //   dataSrc: ''
    // },
    data: successes,
    // deferRender: true,
    autoWidth: false,
    dom: 'tip',
    pageLength: 100,
    language: {
      emptyTable: 'No Customer Wins found',
      zeroRecords: 'No Customer Wins found'
    },
    order: [colIndices.success, 'desc'],

    columns: [
      {
        data: null,
        render: (data, type, row) => `
          <button type="button" class="btn">
            <i class="fa fa-caret-right"></i>
            <i class="fa fa-caret-down"></i>
          </button>
        `
      },
      {
        name: 'success',
        data: {
          _: (row, type, set, meta) => ({
            id: row.id,
            name: row.name,
            curatorId: row.curator.id,
            customerId: row.customer.id
          }),
          display: 'name',
          filter: 'id',
          sort: 'timestamp' // success.created_at
        }
      },
      {
        name: 'customer',
        data: {
          _: (row, type, set, meta) => ({ id: row.customer.id, name: row.customer.name }),
          display: 'customer.name',
          filter: 'customer.id',
          sort: 'customer.name'
        }
      },
      {
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
          _: (row, type, set, meta) => (
            row.story && { id: row.story.id, title: row.story.title }
          )
        },
        defaultContent: 'false'
      },
      {
        data: 'display_status',
        render: (data, type, row, meta) => actionsDropdownTemplate(data, row)
      }
    ],

    columnDefs: [
      { targets: [colIndices.customer, colIndices.curator, colIndices.story], visible: false },
      {
        targets: [0, colIndices.actions],
        orderable: false,
        searchable: false,
        createdCell: (td, cellData, rowData, row, col) => (
          $(td).addClass(col === 0 ? 'toggle-child' : 'actions dropdown')
        )
      },
      { targets: [colIndices.curator, colIndices.story],  width: '0%' },  // hidden
      { targets: 0, width: '5%' },
      { targets: colIndices.success, width: '61%' },
      { targets: colIndices.customer, width: '0%'},
      { targets: colIndices.status, width: '26%' },
      { targets: colIndices.actions, width: '8%' }
    ],

    rowGroup: {
      dataSrc: 'customer.name',
      startRender: function (groupRows, successName) {
        // console.log($(this))   //  [RowGroup]
        const customerId = $('#successes-table').DataTable().rows(groupRows[0][0]).data()[0].customer.id;
        return $('<tr/>').append(`
          <td colspan="3">
            <span style="font-weight:600">
              ${groupRows.data()[0].customer.name}
            </span>
          </td>
          <td colspan="1">
            <button type="button" class="edit-customer" data-customer-id="${customerId}">
              <i class="glyphicon glyphicon-pencil"></i>
              <div><i class="fa fa-circle-o-notch"></i></div>
            </button>
          </td>
        `);
      }
    },

    createdRow: function (row, data, index) {
      $(row).attr('data-customer-id', data.customer.id);
      $(row).attr('data-success-id', data.id);
      $(row).children().eq(0).addClass('toggle-child');
      $(row).children().eq(1).attr('data-filter', data.id);
      $(row).children().eq(2).addClass('status');
      $(row).children().eq(3).addClass('actions dropdown');
    },

    initComplete(settings) {
      // console.log('settings', settings)
      // const dt = this.api()
      tableWrapper = table.parentElement;
      tableControls = tableWrapper.previousElementSibling;
      initTableControls(tableControls, tableWrapper, table);
      cloneFilterResults(tableControls, tableWrapper, table);

      // this.on('draw.dt', (e) => {
      // })
    },

    drawCallback(settings) {
      redrawRowGroups(tableControls, this.api().rowGroup());
    }
  });
}

function handleAction({ target }) {
  const row = dt.row(target.closest('tr'));
  const isViewContributions = target.closest('.view-contributions');
  const isDelete = target.closest('.delete-row');
  if (isViewContributions) {

    // can't search on successId given current setup of the table data
    // const contributionIds = $('#prospect-contributors-table').DataTable().rows().data().toArray()
    //   .filter(contribution => (
    //     contribution.success.id == successId &&
    //     (contribution.status && contribution.status.match(/(contribution|feedback)/))
    //   ))
    //   .map(contribution => contribution.id);
    // showContributions(e)
  } else if (isDelete) {
    deleteCustomerWin(row);
  }
}