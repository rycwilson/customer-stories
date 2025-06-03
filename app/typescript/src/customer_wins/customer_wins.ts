import type { Config, Api } from 'datatables.net-bs';

export function newCustomerWinPath(params: URLSearchParams) {
  const subdomain = location.host.split('.')[0];
  return `/companies/${subdomain}/successes/new${params.size > 0 ? `?${params}` : ''}`;
}

export function editCustomerWinPath(successId: string | number) {
  return `/successes/${successId}/edit`;
}

export function dataTableConfig(): Config {
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
        name: 'actions',
        data: {
          _: 'display_status',
          display: actionsDropdownTemplate
        },
        createdCell: (td: Node) => {
          $(td)
            .attr('data-controller', 'dropdown');

          // ['add', 'invite', 'show'].forEach(action => (
          //   $(td).attr(`customer-win:${action}-contributors`, `dashboard#${action}CustomerWinContributors`)
          // ));
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
        targets: [0, colIndices.story, colIndices.actions],
        searchable: false,
      },
      { targets: [colIndices.curator, colIndices.story],  width: '0' },  // hidden
      { targets: [0], width: '1.75em' },
      { targets: colIndices.success, width: 'auto' },
      { targets: colIndices.status, width: '12em' },
      { targets: colIndices.actions, width: '5em' }
    ],

    rowGroup: {
      dataSrc: 'customer.name',
      startRender(rows: Api<any>, group: string) {
        const groupRows = rows;
        const customerName = group;
        const customerId = groupRows.data()[0].customer.id;
        return $('<tr />').append(`
          <td colspan="4"> 
            <a 
              href="/customers/${customerId}/edit" 
              style="font-weight:600"
              data-turbo-stream
              data-controller="modal-trigger"
              data-modal-trigger-modal-outlet="#main-modal"
              data-modal-trigger-params-value='${JSON.stringify({ title: 'Edit Customer', className: 'edit-customer' })}'>
              ${customerName}
            </a>
          </td>
        `);
      }
    },

    createdRow(tr: Node, data: object | any[], index: number) {
      const { id, display_status: status, new_story_path: newStoryPath, curator, customer, story, path } = data as CustomerWin;
      $(tr)
        .attr('data-customer-win-datatable-outlet', '#successes-table')
        .attr('data-customer-win-modal-outlet', '#main-modal')
        .attr('data-customer-win-row-data-value', JSON.stringify({ id, status, newStoryPath, curator, customer, story, path }))
        .attr(
          'data-customer-win-child-row-turbo-frame-attrs-value', 
          JSON.stringify({ id: 'edit-customer-win', src: editCustomerWinPath(id) })
        )
        .attr(
          'data-action', 
          'dropdown:dropdown-is-shown->customer-win#onShownDropdown dropdown:dropdown-is-hidden->customer-win#onHiddenDropdown'
        )
        .attr('data-controller', 'customer-win')
    }
  }
}

function actionsDropdownTemplate(row: CustomerWin, type: string, set: any) {
  const { id, display_status: status, new_story_path: newStoryPath, curator, customer, story } = row;
  const noContributorsAdded = status && /0.+Contributors\sadded/.test(status);
  const noContributorsInvited = status && /0.+Contributors\sinvited/.test(status);
  
  // TODO There are better places to show contributions, i.e. with the contributor or story
  // TODO Explore separation of Customer Win contributions and Story contributions
  // const contributionsExist = status && /[^0]&nbsp;&nbsp;Contributions\ssubmitted/.test(status);
  const contributionsExist = false;

  const action = noContributorsAdded ? 'Add' : (noContributorsInvited ? 'Invite' : '');
  const editStoryPath = story ? `/stories/${story.id}/edit` : undefined;
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
            <a href="javascript:;" data-action="dashboard#editStory" data-story-path="${editStoryPath}" data-story-tab="${tab}">
              <i class="fa ${icon} fa-fw action"></i>&nbsp;&nbsp;
              ${text}
            </a>
          </li>
        `;
      })
      .join('')
  );
  return `
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
  `;
}