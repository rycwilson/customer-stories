import type { Config, Api } from 'datatables.net-bs';
import { minifyHtml } from '../utils';

enum Cols {
  Customer = 1,
  Win,
  Curator,
  Status,
  Story,
  Actions
}

export function toggleColumnVisibility(dt: Api<any>, rowGroupDataSource: string) {
  dt.column(Cols.Customer).visible(!rowGroupDataSource);
}

export function dataTableConfig(rowGroupDataSource: string): Config {
  if (!CSP.customerWins) console.error('Customer Wins data is not defined');

  const rowGroupColumn = (() => {
    switch (rowGroupDataSource) {
      case 'customer.name': return Cols.Customer;
      default: return undefined;
    }
  })();

  return {
    // Since table rows are generated dynamically and their associated actions dropdown
    // is derived from the row's status, the actions dropdown template is provided in this file.
    // To avoid repetition in the server and increased payload, and because the dropdown html
    // will also be required when rendering row views, merge with the server data here.
    // Use snake case to alisgn with server data convention.
    data: CSP.customerWins?.map(win => ({ 
      ...win,
      actions_dropdown_html: actionsDropdownTemplate(win) 
    })) || [],
    
    language: { 
      emptyTable: 'No Customer Wins found',
      zeroRecords: 'No Customer Wins found'
    },

    order: rowGroupColumn ?
      [[rowGroupColumn, 'asc'], [Cols.Win, 'asc']] :
      [[Cols.Customer, 'asc']],

    columns: [
      {
        name: 'toggleChild',
        data: null,
        render: (data: any, type: string, row: CustomerWin) => {
          const toggleBtn = `
            <button type="button" class="btn" data-action="customer-win#toggleChildRow">
              <i class="fa fa-caret-right"></i>
              <i class="fa fa-caret-down"></i>
            </button>
          `;
          return type === 'display' ? toggleBtn : data;
        },
        createdCell: (td) => $(td).addClass('toggle-child')
      },
      {
        name: 'customer',
        data: {
          _: 'customer.name',
          filter: 'customer.id',
        }
      },
      {
        name: 'success',
        data: {
          _: 'name',
          filter: 'id',
        },

        // Here the render function is necessary because the filter value (row.id) exists at the top level of the row object,
        // Note how no render function is necessary for the 'customer' and 'curator' columns, as they are nested objects
        render: (data: any, type: string, row: CustomerWin) => {
          if (type === 'filter') return row.id.toString();
          return data;
        },
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
        name: 'actions',
        data: {
          _: 'display_status',

          // function accepts `FunctionColumnData` interface
          display: actionsDropdownTemplate
        },
        createdCell: (td: Node) => {
          $(td).attr('data-controller', 'dropdown');

          // ['add', 'invite', 'show'].forEach(action => (
          //   $(td).attr(`customer-win:${action}-contributors`, `dashboard#${action}CustomerWinContributors`)
          // ));
        }
      }
    ],

    columnDefs: [
      { 
        targets: (() => {
          const alwaysHidden = [Cols.Curator, Cols.Story]
          return [...alwaysHidden, ...(rowGroupColumn ? [rowGroupColumn] : [])];
        })() as number[],
        visible: false 
      },
      { 
        targets: [0, Cols.Story, Cols.Actions], 
        orderable: false 
      },
      {
        targets: [0, Cols.Story, Cols.Actions],
        searchable: false,
      },
      { targets: [0], width: '1.75em' },
      { targets: Cols.Win, width: 'auto' },
      { targets: Cols.Status, width: '12em' },
      { targets: Cols.Actions, width: '3.5em' }
    ],

    rowGroup: {
      enable: !!rowGroupDataSource,
      dataSrc: rowGroupDataSource,
      startRender: function (
        this: { dataSrc: () => string, s: { dt: Api<any> } },
        rows: Api<any>, 
        groupValue: string
      ) {
        const { customer } = rows.data()[0];
        return $('<tr />').append(`
          <td colspan="4"> 
            <a 
              href="/customers/${customer.id}/edit" 
              style="font-weight:600"
              data-turbo-stream
              data-controller="modal-trigger"
              data-modal-trigger-modal-outlet="#main-modal"
              data-modal-trigger-params-value='${JSON.stringify({ title: 'Edit Customer', className: 'edit-customer' })}'>
              ${customer.name}
            </a>
          </td>
        `);
      }
    },

    createdRow(tr: Node, data: object | any[], index: number) {
      const rowData = transformSourceData(data as CustomerWin);
      $(tr)
        .attr('data-customer-win-datatable-outlet', '#successes-table')
        .attr('data-customer-win-modal-outlet', '#main-modal')
        .attr(
          'data-customer-win-row-data-value',
          JSON.stringify(rowData)
        )
        .attr(
          'data-customer-win-child-row-turbo-frame-attrs-value', 
          JSON.stringify({ id: 'edit-customer-win', src: rowData.editPath })
        )
        .attr('data-action', [
          'dropdown:dropdown-is-shown->customer-win#onShownDropdown',
          'dropdown:dropdown-is-hidden->customer-win#onHiddenDropdown',
          'click->customer-win#openView'
        ].join(' '))
        .attr('data-controller', 'customer-win');
    }
  }
}

// Transform source row data to `rowData` used by CustomerWinController
// This involves transformation to cameCase and filtering out unneeded fields
function transformSourceData(row: CustomerWin) {
  const rowData: CustomerWinRowData = {
    id: row.id,
    curator: row.curator,
    customer: row.customer,
    status: row.display_status,
    path: row.path,
    editPath: row.edit_path,
    turboFrame: { id: 'edit-customer-win', src: row.edit_path }
  };
  if (row.story) rowData.story = row.story;
  if (row.new_story_path) rowData.newStoryPath = row.new_story_path;
  return rowData;
}

export function actionsDropdownTemplate(
  row: CustomerWin, 
  type?: string,
  s?: undefined,
  meta?: { row: number, col: number, settings: object }
): string {
  const { id, display_status: status, story, new_story_path: newStoryPath } = row;
  const noContributorsAdded = status && /0.+Contributors\sadded/.test(status);
  const noContributorsInvited = status && /0.+Contributors\sinvited/.test(status);
  
  // TODO There are better places to show contributions, i.e. with the contributor or story
  // TODO Explore separation of Customer Win contributions and Story contributions
  // const contributionsExist = status && /[^0]&nbsp;&nbsp;Contributions\ssubmitted/.test(status);
  const contributionsExist = false;

  const action = noContributorsAdded ? 'Add' : (noContributorsInvited ? 'Invite' : '');
  const editStoryDropdownItems = (
    [
      ['Story Narrative Content', 'story-narrative-content', 'fa-edit'], 
      ['Story Testimonials', 'story-testimonials', 'fa-quote-left'], 
      ['Story Contributors', 'story-contributions', 'fa-users'], 
      ['Story Publication Settings', 'story-settings', 'fa-cloud-upload']
    ]
      .map(([text, tab, icon]) => {
        return `
          <li>
            <a href="javascript:;" data-action="dashboard#editStory" data-story-path="${story?.edit_path}" data-story-tab="${tab}">
              <i class="fa ${icon} fa-fw action"></i>&nbsp;&nbsp;
              ${text}
            </a>
          </li>
        `;
      })
      .join('')
  );
  return minifyHtml(`
    <a id="customer-win-actions-dropdown-${id}" 
      href="#" 
      class="dropdown-toggle" 
      data-toggle="dropdown"
      aria-haspopup="true" 
      aria-expanded="false">
      <i style="font-size:1.15em" class="fa fa-ellipsis-v"></i>
    </a>
    <ul 
      class="dropdown-menu dropdown-menu-right" 
      data-dropdown-target="dropdownMenu"
      aria-labelledby="customer-win-actions-dropdown-${id}">
      ${contributionsExist ? `
          <li>
            <a href="javascript:;" data-action="customer-win#showContributions">
              <i class="fa fa-comments fa-fw action"></i>
              Contributions
            </a>
          </li>
          <li class="divider" role="separator"></li>
        ` : 
        ''
      }
      ${story ? 
          editStoryDropdownItems : `
          <li>
            <a href="javascript:;" 
              data-action="dashboard#${action.toLowerCase() || 'show'}CustomerWinContributors" 
              data-customer-win-id="${id}">
              <i class="fa fa-users fa-fw action"></i>
              ${action} Contributors
            </a>
          </li>
          <li role="separator" class="divider"></li>
          <li>
            <a 
              href="${newStoryPath}"
              aria-label="New Customer Story"
              data-turbo-stream
              data-controller="modal-trigger" 
              data-modal-trigger-modal-outlet="#main-modal"
              data-modal-trigger-params-value='${JSON.stringify({ title: 'New Customer Story', className: 'new-story' })}'>
              <i class="fa fa-play fa-fw action"></i>
              Start Customer Story
            </a>
          </li>
        `
      }
      <li role="separator" class="divider"></li>
      <li>
        <a href="javascript:;" data-action="customer-win#deleteRow">
          <i class="fa fa-remove fa-fw action"></i>
          Delete
        </a>
      </li>
    </ul>
  `);
}