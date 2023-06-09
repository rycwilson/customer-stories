import { toggleRowStripes } from '../dashboard/tables.js';

const tsBaseOptions = {
  create: true,
  persist: false,
  maxOptions: null,
  onInitialize() {
  },
  plugins: {
    'clear_button': {
      title: 'Clear selection',
      html: (config) => (`<button type="button" class="btn ${config.className}" title="${config.title}">&times;</button>`)
    }
  }
};

let table, tableWrapper, tableControls, dt;

export default {
  init(successes) {
    const colIndices = {
      success: 1,
      customer: 2,
      curator: 3,
      status: 4,
      story: 5,
      actions: 6,
    }
    table = document.getElementById('successes-table');
    tableWrapper = table.parentElement;
    tableControls = table.previousElementSibling;
    dt = new DataTable('#successes-table', {
      // ajax: {
      //   url: '/successes',
      //   dataSrc: ''
      // },
      data: successes,
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
        // console.log(settings)

        // the table api captured in the dt variable is not available until after a timeout
        setTimeout(() => {
          initTableControls();
          cloneFilterResults();
          // table.closeststyle.visibility = 'visible';
        })
      }
    });
  }
}

function cloneFilterResults() {
  const originalResults = tableWrapper.querySelector('.dataTables_info');
  const clone = originalResults.cloneNode();
  const formatText = () => clone.textContent = originalResults.textContent.replace(/\sentries/g, '');
  clone.id = `${originalResults.id}--clone`;
  clone.classList.add('help-block', 'text-right');
  formatText();
  tableWrapper.querySelector('.select-filters').appendChild(clone);
  $(table).on('draw.dt', formatText);
};

function initTableControls() {
  const addBtn = document.getElementById('prospect').querySelector('layout-sidebar .nav .btn-add');
  const paginationBtns = tableWrapper.querySelector('.dataTables_paginate');
  const addRowGroupsListener = () => (
    document.getElementById('toggle-group-by-customer').addEventListener('change', (e) => {
      toggleRowStripes(table, e.currentTarget.checked)
      // table.classList.toggle('table-striped');
      // table.querySelectorAll('.dtrg-group').forEach(tr => tr.classList.toggle('hidden'));
    })
  );
  const addStoryFlagListener = () => (
    document.getElementById('show-wins-with-story').addEventListener('change', (e) => searchTable(curatorId, filterVal))
  );
  let curatorId = CSP.currentUser.id;
  let filterVal = '';
  let currentFilterOptions;   // the select options resulting from search
  $(addBtn).show();
  $(paginationBtns).show();
  addRowGroupsListener();
  addStoryFlagListener();
  const tsCurator = new TomSelect(
    tableControls.querySelector('select.curator-select'), 
    Object.assign({}, tsBaseOptions, { onChange: (newVal) => searchTable(curatorId = newVal, filterVal) })
  );
  tsCurator.setValue(CSP.currentUser.id);
  const tsFilter = new TomSelect(
    tableControls.querySelector('select.dt-filter'),
    Object.assign({}, tsBaseOptions, { 
      onChange(newVal) {
        searchTable(curatorId, filterVal = newVal)
        if (!newVal) this.close();
      }, 
      onType() {
        currentFilterOptions = this.currentResults.items;
        const searchResults = this.currentResults.items
          .map(item => item.id)
          .reduce((results, result) => {
            const column = result.slice(0, result.indexOf('-'));
            const id = result.slice(result.indexOf('-') + 1, result.length);
            if (!results[column]) results[column] = `${id}`
            else results[column] = `${results[column]}|${id}`;
            return results;
          }, {});
        searchTable(curatorId, filterVal = searchResults, true);
      },
      onDropdownOpen(dropdown) {
        // if a search string exists, manually set the current results
        if (this.getValue() === '0') this.currentResults.items = currentFilterOptions;
      },
      onDropdownClose(dropdown) {
        // default behavior is that text input is cleared when the dropdown closes, 
        // but we want to keep it since the search results are reflected in the table
        // => accomplished by adding and selecting an option to match the search text
        if (!this.getValue() && this.lastQuery) {
          this.addOption({ value: 0, text: this.lastQuery }, true);   // true => option will be removed on clear
          this.addItem(0, true);    // true => don't trigger change event
        }
      }
    })
  );
}

function searchTable(curatorId, filterVal) {
  // console.log(`searchTable(${curatorId}, ${filterVal})`)
  let dtSearch = dt
    .search('')
    .columns().search('')
    .column('curator:name').search(curatorId ? `^${curatorId}$` : '', true, false)
    .column('story:name').search(document.getElementById('show-wins-with-story').checked ? '' : '^false$', true, false);
  
  // as the user types, search the table for the found options in the select box
  // => this ensures the datatables search matches the tomselect search
  if (typeof filterVal === 'object') {
    console.log(filterVal)
    Object.keys(filterVal).forEach(column => {
      dtSearch = dtSearch.column(`${column}:name`).search(`^(${filterVal[column]})$`, true, false);
    });
  } else if (filterVal) {
    const column = filterVal.slice(0, filterVal.indexOf('-'));
    const id = filterVal.slice(filterVal.indexOf('-') + 1, filterVal.length);
    dtSearch = dtSearch.column(`${column}:name`).search(`^${id}$`, true, false);
  }
  dtSearch.draw();
}

function actionsDropdownTemplate(displayStatus, rowData) {
  const noContributorsAdded = displayStatus.match(/0.+Contributors\sadded/);
  const noContributorsInvited = displayStatus.match(/0.+Contributors\sinvited/);
  const contributionsExist = displayStatus.match(/[^0]&nbsp;&nbsp;Contributions\ssubmitted/);
  const storyExists = rowData.story;
  const storyPath = storyExists && `/curate/${rowData.customer.slug}/${rowData.story.slug}`;
  const contributorsAction = (() => {
    const className = `${noContributorsAdded ? 'add' : 'manage'}-contributors`;
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
          <li class="view-submissions">
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
      <li class="remove">
        <a href="javascript:;">
          <i class="fa fa-remove fa-fw action"></i>&nbsp;&nbsp;
          <span>Remove</span>
        </a>
      </li>
    </ul>
  `;
}