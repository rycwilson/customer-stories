import { Controller } from "@hotwired/stimulus";
import { getJSON, kebabize } from '../util';
import { 
  init as initTable,
  initComplete as tableInitComplete,
  search as searchTable
} from '../tables';
import { newCustomerWinPath } from '../customer_wins/customer_wins';
import { newContributionPath } from '../contributions/contributions';

export default class extends Controller {
  static outlets = ['dashboard', 'resource'];
  static targets = ['curatorSelect', 'filterSelect', 'filterResults', 'datatable', 'newItemBtn', 'tableDisplayOptionsBtn'];
  static values = { dataPath: String, checkboxFilters: { type: Object, default: {} } }

  dt;
  resourceName;

  initialize() {
    console.log(`init ${this.element.dataset.resourceName}`);
    this.resourceName = this.element.dataset.resourceName;
  }
  
  connect() {
    console.log(`connect ${this.resourceName}`)
    if (CSP[this.resourceName]) {
      initTable(this);
    } else {
      getJSON(this.dataPathValue).then(data => {
        CSP[this.resourceName] = data;
        initTable(this);
      })
    }
  }

  tableInitComplete(e) {
    tableInitComplete(this, e.detail.dt);
  }

  searchTable(e = { type: '', detail: {} }) {
    searchTable(this, e, this.contributorsOutlet);
  }

  onCuratorChange(e) {
    // this.updateNewCustomerWinPath();
    this.updateNewItemPath();
    searchTable(this, e, this.contributorsOutlet);
  }

  onFilterChange(e) {
    this.updateNewItemPath();
    // this.contributorsOutlet.updateNewItemPath(e.target.value);
    searchTable(this, e, this.contributorsOutlet);
  }
  
  checkboxFiltersValueChanged(newVal, oldVal) {
    if (Object.keys(oldVal).length === 0) return false;
    searchTable(this);
  }

  updateNewItemPath() {
    const filterVal = this.filterSelectTarget.value;
    const type = filterVal && filterVal.slice(0, filterVal.lastIndexOf('-'));
    const id = filterVal && filterVal.slice(filterVal.lastIndexOf('-') + 1, filterVal.length);
    const customerWinId = type === 'customer' && id;
    const params = new URLSearchParams();
    params.set('curator_id', this.curatorSelectTarget.value);
    if (filterVal) params.set(`${type}_id`, id);
    this.newItemBtnTarget.setAttribute(
      'data-modal-trigger-turbo-frame-attrs-value',
      JSON.stringify({ 
        id: `new-${kebabize(this.resourceName)}`.slice(0, -1),  // remove the trailing 's' 
        src: (() => {
          switch (this.resourceName) {
            case 'customerWins':
              return newCustomerWinPath(params);
            case 'contributions':
              return newContributionPath(customerWinId, params);
            default: 
              return '';
          }
        })()
      })
    );
  }

  tableConfig() {
    const colIndices = { success: 1, customer: 2, curator: 3, status: 4, story: 5, actions: 6 };
    return {
      data: CSP.customerWins,
      
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
          `,
          createdCell: (td) => td.classList.add('toggle-child')
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
          },
          createdCell: (td) => td.classList.add('status')
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
          render: (data, type, row, meta) => '',    // customer win controller will render the dropdown
          createdCell: (td) => {
            td.classList.add('dropdown');
            td.setAttribute('data-controller', 'actions-dropdown');
            td.setAttribute('data-customer-win-target', 'actionsDropdown');
            ['add', 'invite', 'show'].forEach(action => (
              td.setAttribute(`customer-win:${action}-contributors`, `dashboard#${action}CustomerWinContributors`)
            ));
          }
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
        startRender(groupRows, customerName) {
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
                  data-modal-trigger-turbo-frame-attrs-value=${JSON.stringify(turboFrameAttrs)}
                  data-action="modal-trigger#showModal">
                  <i class="glyphicon glyphicon-pencil"></i>
                  <!-- <div><i class="fa fa-circle-o-notch"></i></div> -->
                </button>
              </td>
            `);
        }
      },
  
      createdRow(row, data, index) {
        const { id, display_status: status, customer, story } = data;
        row.setAttribute('data-controller', 'customer-win');
        row.setAttribute('data-customer-win-contributors-outlet', '#contributors')
        row.setAttribute('data-customer-win-modal-outlet', '#main-modal');
        row.setAttribute('data-customer-win-contributions-modal-outlet', '.contributions-modal')
        row.setAttribute('data-customer-win-row-data-value', JSON.stringify({ id, status, customer, story }));
        row.setAttribute('data-datatable-target', 'row');

        // $(row).attr('data-customer-id', data.customer.id);
        // $(row).attr('data-success-id', data.id);
        // $(row).children().eq(1).attr('data-filter', data.id);
      }
    }
  }
}