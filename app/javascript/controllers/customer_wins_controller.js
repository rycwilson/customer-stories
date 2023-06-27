import { Controller } from "@hotwired/stimulus";
import { searchTable } from '../actions/tables.js';
import { getJSON } from '../util';

export default class extends Controller {
  static targets = ['rowGroupsCheckbox', 'filterCheckbox', 'curatorSelect', 'filterSelect', 'datatable'];
  static values = { dataPath: String };

  static customerWins = [];

  initialize() {}

  connect() {
    // console.log('connect customer wins')
    this.element.customerWins = this;

    getJSON(this.dataPathValue).then(successes => {
      this.customerWins = successes;
      console.log('customer wins: ', this.customerWins)
      this.datatableTarget.setAttribute('data-datatable-ready-value', 'true');
      const panel = this.element.closest('[data-dashboard-target="tabPanel"]');
      this.dispatch('load', { detail: { panel, resourceClassName: 'customer-wins' }});
    })
  }

  searchTable(e = { detail: {} }) {
    searchTable.bind(this)(e.detail.searchResults);
  }
  
  tableInitComplete(e) {
    this.searchTable();
  }

  toggleRowGroups() {
    this.datatableTarget.setAttribute('data-datatable-enable-row-groups-value', this.rowGroupsCheckbox.checked);
  }

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
          render: (data, type, row, meta) => this.actionsDropdownTemplate(data, row),
          createdCell: (td) => {
            td.classList.add('dropdown');
            td.setAttribute('data-controller', 'actions-dropdown');
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
        row.setAttribute('data-datatable-target', 'dtRow')
        $(row).attr('data-customer-id', data.customer.id);
        $(row).attr('data-success-id', data.id);
        $(row).children().eq(1).attr('data-filter', data.id);
      }
    }
  }

  actionsDropdownTemplate(displayStatus, rowData) {
    const noContributorsAdded = displayStatus.match(/0.+Contributors\sadded/);
    const noContributorsInvited = displayStatus.match(/0.+Contributors\sinvited/);
    const contributionsExist = displayStatus.match(/[^0]&nbsp;&nbsp;Contributions\ssubmitted/);
    const storyExists = rowData.story;
    const storyPath = storyExists && `/curate/${rowData.customer.slug}/${rowData.story.slug}`;
    const contributorsAction = (() => {
      const className = `${noContributorsAdded ? 'add' : 'invite'}-contributors`;
      const action = noContributorsAdded ? 'Add' : (noContributorsInvited ? 'Invite' : 'Manage');
      return `
        <li class="${className}">
          <a href="javascript:;">
            <i class="fa fa-users fa-fw action"></i>&nbsp;&nbsp;
            <span>${action} Contributors</span>
          </a>
        </li>
      `;
    })();
    return `
      <a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown">
        <i class="fa fa-caret-down"></i>
      </a>
      <ul class="success-actions dropdown-menu dropdown-menu-right">
        ${contributionsExist ? `
            <li class="view-contributions">
              <a href="javascript:;">
                <i class="fa fa-comments fa-fw action"></i>&nbsp;&nbsp;
                <span>View Contributions</span>
              </a>
            </li>
            <li role="separator" class="divider"></li>
          ` : 
          ''
        }
        ${storyExists ? 
            [['story-settings', 'fa-gear'], ['story-content', 'fa-edit'], ['story-contributors', 'fa-users']]
              .map(([className, icon]) => {
                const section = (
                  className[className.indexOf('-') + 1].toUpperCase() + 
                  className.slice(className.indexOf('-') + 2, className.length)
                )
                return `
                  <li class="${className}">
                    <a href="${storyPath}">
                      <i class="fa ${icon} fa-fw action"></i>&nbsp;&nbsp;
                      <span>Customer Story ${section}</span>
                    </a>
                  </li>
                `;
              }).join('') : `
            ${contributorsAction}
            <li role="separator" class="divider"></li>
            <li class="start-curation">
              <a href="javascript:;">
                <i class="fa fa-play fa-fw action"></i>&nbsp;&nbsp;
                <span>Start Customer Story</span>
              </a>
            </li>
          `
        }
        <li role="separator" class="divider"></li>
        <li class="delete-row">
          <a href="javascript:;">
            <i class="fa fa-remove fa-fw action"></i>&nbsp;&nbsp;
            <span>Remove</span>
          </a>
        </li>
      </ul>
    `;
  }
}