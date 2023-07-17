import { Controller } from "@hotwired/stimulus";
import { getJSON } from '../util';

export default class extends Controller {
  static outlets = ['dashboard', 'contributors'];
  static targets = ['curatorSelect', 'filterSelect', 'filterResults', 'datatable', 'newCustomerWinBtn', 'tableDisplayOptionsBtn'];
  static values = { 
    dataPath: String, 
    checkboxFilters: { 
      type: Object, 
      default: { 
        'show-wins-with-story': { checked: true, label: 'Customer Wins with Story started' } 
      }
    }
  }

  customerWins;
  dt;

  connect() {
    getJSON(this.dataPathValue).then(successes => {
      this.customerWins = successes;
      console.log('customer wins: ', this.customerWins)
      this.datatableTarget.setAttribute('data-datatable-ready-value', 'true');
      // this.datatableTarget.readyValue = true;
      const panel = this.element.closest('[data-dashboard-target="tabPanel"]');
      this.dispatch('load', { detail: { panel, resourceClassName: 'customer-wins' }});
    })
  }

  tableInitComplete(e) {
    this.dt = e.detail.dt;
    this.dashboardOutlet.initTableDisplayOptionsPopover.bind(this)();
    this.searchTable();
  }

  searchTable(e = { type: '', detail: {} }) {
    const isUserInput = e.type;
    if (e.type.includes('change-curator')) {
      this.contributorsOutlet.curatorSelectTarget.tomselect.setValue(this.curatorSelectTarget.value, true);
    } else if (e.type.includes('change-filter')) {
      this.contributorsOutlet.filterSelectTarget.tomselect.setValue(this.filterSelectTarget.value, true);
    }
    
    // allow the visible table to be drawn before searching the other table
    if (isUserInput && e.target.dataset.syncTables)
      this.element.addEventListener('datatable:customer-wins-drawn', () => {
        setTimeout(() => this.dashboardOutlet.searchTable.bind(this.contributorsOutlet)());
      }, { once: true });
    this.dashboardOutlet.searchTable.bind(this)(e.detail && e.detail.searchResults);
  }

  onCuratorChange(e) {
    this.searchTable(e);
  }

  onFilterChange(e) {
    this.contributorsOutlet.updateNewContributionPath(e.target.value);
    this.searchTable(e);
  }
  
  checkboxFiltersValueChanged(newVal, oldVal) {
    if (oldVal === undefined) return false;
    this.searchTable();
  }

  toggleRowGroups(e) {
    this.datatableTarget.setAttribute('data-datatable-enable-row-groups-value', e.target.checked);
  }

  cloneFilterResults(tableControls, tableWrapper, table) {
    const originalResults = this.element.nextElementSibling;
    const clone = originalResults.cloneNode();
    const formatText = () => clone.textContent = originalResults.textContent.replace(/\sentries/g, '');
    clone.id = `${originalResults.id}--clone`;
    clone.classList.add('help-block', 'text-right');
    formatText();
    tableControls.querySelector('.select-filters').appendChild(clone);
    this.dispatch('clone-filter-results', { detail: clone })
    $(table).on('draw.dt', formatText);
  };

  tableConfig() {
    const colIndices = { success: 1, customer: 2, curator: 3, status: 4, story: 5, actions: 6 };
    return {
      data: this.customerWins,
      
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