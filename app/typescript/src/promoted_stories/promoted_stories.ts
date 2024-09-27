import type { Config } from 'datatables.net-bs';

export function tableConfig(): Config {
  const colIndices = { customer: 1, title: 2, status: 3, curator: 4, actions: 5 };
  return {
    data: CSP.promotedStories,
    // autoWidth: false,
    // dom: 'tp',
    language: {
      emptyTable: 'No Promoted Stories found',
      zeroRecords: 'No Promoted Stories found'
    },
    
    order: [[ colIndices.status, 'asc' ], [colIndices.customer, 'asc']],

    columns: [
      {
        name: 'story',
        data: 'storyId',
        render: (storyId: number, type: string, row: AdwordsAd) => {
          const toggleBtn = `
            <button type="button" class="btn" data-action="promoted-story#toggleChildRow">
              <i class="fa fa-caret-right"></i>
              <i class="fa fa-caret-down"></i>
            </button>
          `;
          return type === 'display' ? toggleBtn : storyId;
        },
        createdCell: (td: Node) => $(td).addClass('toggle-child')
      },
      {
        name: 'customer',
        data: {
          _: 'customer.id',
          display: 'customer.name'
        }
      },
      {
        name: 'longHeadline',
        data: 'longHeadline',
        // createdCell: (td: Node) => $(td).addClass('promoted-story-title form-is-clean')
      },
      {
        name: 'status',
        data: 'status',
        createdCell: (td: Node) => $(td).addClass('status'),
        render: (status, type, row: AdwordsAd) => {
          const { id, path } = row;
          return type !== 'display' ?
            status : `
            <form 
              action="${path}" 
              method="post" 
              data-remote="true" 
              data-promoted-story-target="statusForm"
              data-action="ajax:success->promoted-story#onAjaxSuccess">
              <input type="hidden" name="_method" value="patch">
              <input type="hidden" name="authenticity_token" value="${CSP.authToken}">
              <input 
                type="hidden" 
                name="adwords_ad[status]" 
                value="PAUSED" 
                data-promoted-story-target="statusCheckbox"
                ${status === 'PAUSED' ? 'checked' : ''}>
              <div data-controller="bootstrap-switch" data-bootstrap-switch-size-value="small">
                <input 
                  type="checkbox"
                  name="adwords_ad[status]"
                  value="ENABLED"
                  data-bootstrap-switch-target="switch"
                  data-promoted-story-target="statusCheckbox"
                  data-on-text="<i class='fa fa-fw fa-play'></i>"
                  data-off-text="<i class='fa fa-fw fa-pause'></i>"
                  ${status === 'ENABLED' ? 'checked' : ''}>
              </div>
              <span class="help-block" data-promoted-story-target="statusLabel">${status}</span>
            </form>`;
        }
      },
      {
        name: 'curator',
        data: {
          _: 'curator.id',
          display: 'curator.name'
        }
      },
      {
        name: 'actions',
        data: {
          _: 'status',
          display: actionsDropdownTemplate
        },
        createdCell: (td: Node) => $(td).attr('data-controller', 'dropdown')
      }
    ],

    columnDefs: [
      { visible: false , targets: [colIndices.curator], },
      { orderable: false, targets: [0, colIndices.actions] },
      { searchable: false, targets: [0, colIndices.status, colIndices.title] },
      { targets: 0, width: '2em' },
      { targets: colIndices.customer, width: 'auto' },
      { targets: colIndices.title, width: 'auto' },
      { targets: colIndices.status, width: '5em' },
      { targets: colIndices.actions, width: '4.5em' },
    ],

    createdRow: function (tr: Node, data: object | any[], index: number) { 
      // datatable_row_controller expects this property
      const { path } = data as AdwordsAd;
      $(tr)
        .attr('data-controller', 'promoted-story')
        .attr('data-action', 'bootstrap-switch:switch->promoted-story#updateStatus')
        .attr('data-promoted-story-datatable-outlet', '#promoted-stories-table')
        .attr('data-promoted-story-row-data-value', JSON.stringify({ path }))
    }
  };
}

function actionsDropdownTemplate(row: AdwordsAd, type: string, set: any) {
  const { id, editPath } = row;
  return `
    <a id="promoted-story-actions-dropdown-${id}" 
      href="#" 
      class="dropdown-toggle" 
      data-toggle="dropdown"
      aria-haspopup="true" 
      aria-expanded="false">
      <i class="fa fa-caret-down"></i>
    </a>
    <ul 
      class="dropdown-menu dropdown-menu-right" 
      aria-labelledby="promoted-story-actions-dropdown-${id}""
      data-dropdown-target="dropdownMenu">
    <li>
      <a 
        href="javascript:;"
        data-controller="modal-trigger" 
        data-modal-trigger-modal-outlet="#main-modal"
        data-modal-trigger-title-value="Promoted Story Images"
        data-modal-trigger-turbo-frame-attrs-value=${JSON.stringify({ id: 'edit-ad-images', src: editPath })}
        role="button">
        <i class="fa fa-fw fa-image"></i>
        Assign Images
      </a>
    </li>
    <li>
      <a href="/promote/preview/${id}" target="_blank">
        <i class="fa fa-fw fa-external-link"></i>
        Preview
      </a>
    </li>
  `
}