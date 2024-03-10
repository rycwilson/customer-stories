import type { Config, Api } from 'datatables.net-bs';

export function newCustomerWinPath(params: URLSearchParams) {
  const subdomain = location.host.split('.')[0];
  return `/companies/${subdomain}/successes/new${params.size > 0 ? `?${params}` : ''}`;
}

export function editCustomerWinPath(successId: string | number) {
  return `/successes/${successId}/edit`;
}

export function tableConfig(): Config {
  const colIndices = { success: 1, customer: 2, curator: 3, status: 4, story: 5, actions: 6 };
  return {
    data: CSP.customerWins,
    
    language: { 
      emptyTable: 'No Customer Wins found',
      zeroRecords: 'No Customer Wins found'
    },

    orderFixed: [colIndices.customer, 'asc'], // the row grouping column (all sorting will happen secondarily to this)
    order: [[colIndices.success, 'desc']],

    columns: [
      {
        name: 'success',  // this should match the value of the table's search/select options, e.g. value="success-1"
        data: 'id',
        render: (customerWinId: number, type: string, row: CustomerWin) => {
          return type === 'display' ? `
              <button type="button" class="btn" data-action="customer-win#toggleChildRow">
                <i class="fa fa-caret-right"></i>
                <i class="fa fa-caret-down"></i>
              </button>
            ` :
            customerWinId;
        },
        createdCell: (td) => $(td).addClass('toggle-child')
      },
      {
        name: 'name',
        data: {
          _: 'name',
          sort: 'timestamp' // success.created_at
        }
      },
      {
        name: 'customer',
        data: {
          _: 'customer.name',
          filter: 'customer.id',
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
        },
        createdCell: (td: Node) => {
          if (!(td instanceof HTMLTableCellElement)) return;
          td.classList.add('status')
        }
      },
      {
        name: 'story',
        data: {
          _: (row: CustomerWin, type: string, set: any) => (
            row.story && { id: row.story.id, title: row.story.title }
          )
        },
        defaultContent: 'false'
      },
      {
        data: 'display_status',
        render: (data: any, type: string, row: any) => '',    // customer win controller will render the dropdown
        createdCell: (td: Node) => {
          $(td)
            .addClass('dropdown')
            .attr('data-controller', 'actions-dropdown')
            .attr('data-customer-win-target', 'actionsDropdown');
          ['add', 'invite', 'show'].forEach(action => (
            $(td).attr(`customer-win:${action}-contributors`, `dashboard#${action}CustomerWinContributors`)
          ));
        }
      }
    ],

    columnDefs: [
      { 
        targets: [colIndices.customer, colIndices.curator, colIndices.story], 
        visible: false 
      },
      { 
        targets: [0, colIndices.customer, colIndices.story, colIndices.actions], 
        orderable: false 
      },
      {
        targets: [colIndices.story, colIndices.actions],
        searchable: false,
      },
      { targets: [colIndices.curator, colIndices.story],  width: '0%' },  // hidden
      { targets: 0, width: '2em' },
      { targets: colIndices.success, width: 'auto' },
      { targets: colIndices.status, width: '12em' },
      { targets: colIndices.actions, width: '4.5em' }
    ],

    rowGroup: {
      dataSrc: 'customer.name',
      startRender(rows: Api<any>, group: string) {
        const groupRows = rows;
        const customerName = group;
        const customerId = groupRows.data()[0].customer.id;
        const turboFrameAttrs = { id: `edit-customer-${customerId}`, src: `/customers/${customerId}/edit` };
        return $(`
          <tr />`).append(`
            <td colspan="3">
              <span style="font-weight:600">${customerName}</span>
            </td>
            <td colspan="1">
              <button 
                type="button" 
                class="edit-customer" 
                data-controller="modal-trigger"
                data-modal-trigger-modal-outlet="#main-modal"
                data-modal-trigger-title-value="Edit Customer"
                data-modal-trigger-turbo-frame-attrs-value=${JSON.stringify(turboFrameAttrs)}>
                <i class="glyphicon glyphicon-pencil"></i>
                <!-- <div><i class="fa fa-circle-o-notch"></i></div> -->
              </button>
            </td>
          `);
      }
    },

    createdRow(row: Node, data: object | any[], index: number) {
      // TODO interface CustomerWin
      const { id, display_status: status, new_story_path: newStoryPath, curator, customer, story } = data as CustomerWin;
      $(row)
        .attr('data-controller', 'customer-win')
        .attr('data-customer-win-resource-outlet', '#contributors')
        .attr('data-customer-win-modal-outlet', '#main-modal')
        // .attr('data-customer-win-contributions-modal-outlet', '.contributions-modal')
        .attr('data-customer-win-row-data-value', JSON.stringify({ id, status, newStoryPath, curator, customer, story }))
        .attr(
          'data-customer-win-child-row-turbo-frame-attrs-value', 
          JSON.stringify({ id: 'edit-customer-win', src: editCustomerWinPath(id) })
        );
      // $(row).attr('data-customer-id', data.customer.id);
      // $(row).attr('data-success-id', data.id);
      // $(row).children().eq(1).attr('data-filter', data.id);
    }
  }
}