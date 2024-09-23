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
        data: {
          _: 'storyId',
          display: 'story.title'  
        },
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
        createdCell: (td: Node) => $(td).addClass('promoted-story-title form-is-clean')
      },
      {
        name: 'status',
        data: 'status',
        render: (status, type, row: AdwordsAd) => {
          const { id, path } = row;
          return type !== 'display' ?
            status : `
            <form action="${path}" class="ads-status" method="put" data-remote="true" data-type="script" data-submitted="">
              <!-- topic -->
              <input type="hidden" name="story[topic_ad_attributes][id]" value="${id}">
              <input type="hidden" name="story[topic_ad_attributes][status]" value="PAUSED">
              <div data-controller="bootstrap-switch" data-bootstrap-switch-disabled-value="true" data-bootstrap-switch-size-value="small">
                <input 
                  type="checkbox"
                  class="form-control"
                  name="story[topic_ad_attributes][status]"
                  value="ENABLED"
                  data-bootstrap-switch-target="switch"
                  data-on-text="<i class='fa fa-fw fa-play'></i>"
                  data-off-text="<i class='fa fa-fw fa-pause'></i>"
                  ${status === 'ENABLED' ? 'checked' : null}>
              </div>
              <div style="height: 14px;">
                <span class="help-block" style="font-size: 10px; margin: 0">${status}</span>
              </div>
              </form>`;
        }
            // <!-- retarget -->
            // <input type="hidden" name="story[retarget_ad_attributes][id]" value="${row.retarget_ad.id}">
            // <input type="hidden" name="story[retarget_ad_attributes][status]" value="PAUSED">
            // <input 
            //   type="checkbox" 
            //   class="hidden" 
            //   name="story[retarget_ad_attributes][status]" 
            //   value="ENABLED"
            //   ${status === 'ENABLED' ? 'checked' : null}>
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
        data-modal-trigger-turbo-frame-attrs-value=${JSON.stringify({ id: 'edit-adwords-ad-images', src: editPath })}
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