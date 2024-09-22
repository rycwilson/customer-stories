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
        data: 'id',
        render: (storyId: number, type: string, row: PromotedStory) => {
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
        data: 'success.customer.name'
      },
      {
        name: 'long_headline',
        data: 'ads_long_headline'
      },
      {
        name: 'status',
        data: 'ads_status',
        render: (ads_status, type, row, meta) => {
          return type !== 'display' ?
            ads_status : `
            <form action="/stories/${row.id}/update_gads" class="ads-status" method="put" data-remote="true" data-type="script" data-submitted="">
              <!-- topic -->
              <input type="hidden" name="story[topic_ad_attributes][id]" value="${row.topic_ad.id}">
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
                  ${ads_status === 'ENABLED' ? 'checked' : null}>
              </div>
              <div style="height: 14px;">
                <span class="help-block" style="font-size: 10px; margin: 0">${ads_status}</span>
              </div>
              <!-- retarget -->
              <input type="hidden" name="story[retarget_ad_attributes][id]" value="${row.retarget_ad.id}">
              <input type="hidden" name="story[retarget_ad_attributes][status]" value="PAUSED">
              <input 
                type="checkbox" 
                class="hidden" 
                name="story[retarget_ad_attributes][status]" 
                value="ENABLED"
                ${ads_status === 'ENABLED' ? 'checked' : null}>
            </form>`
        }
      },
      {
        name: 'curator',
        data: 'success.curator_id'
      },
      {
        name: 'actions',
        data: {
          _: 'ads_status',
          display: actionsDropdownTemplate
        },
        createdCell: (td: Node) => $(td).attr('data-controller', 'dropdown')
      }
    ],

    columnDefs: [
      { targets: [colIndices.curator], visible: false },
      { targets: [0, colIndices.title, colIndices.actions], orderable: false },
      {
        // targets: [colIndices.status, colIndices.title, colIndices.actions],
        targets: [0, colIndices.status, colIndices.title],
        searchable: false
      },
      { targets: 0, width: '2em' },
      { targets: colIndices.customer, width: 'auto' },
      { targets: colIndices.title, width: 'auto' },
      { targets: colIndices.status, width: '5em' },
      { targets: colIndices.actions, width: '4.5em' },
    ],

    createdRow: function (tr: Node, data: object | any[], index: number) { 
      const { id, title } = data as PromotedStory;
      $(tr)
        .attr('data-controller', 'promoted-story')
        .attr('data-promoted-story-datatable-outlet', '#promoted-stories-table')
        .attr('data-promoted-story-row-data-value', JSON.stringify({ id, title }))
        .attr('data-story-id', id)
        .children()
          .eq(1)
            .attr('data-title', title)
            .addClass('promoted-story-customer')
            .end()
          .eq(2)
            .addClass('promoted-story-title form-is-clean')
            .end()
          .eq(3)
            .addClass('status dropdown')
            .end()
    }
  };
}

function actionsDropdownTemplate(row: PromotedStory, type: string, set: any) {
  const { id } = row;
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
      <a role="button">
        <i class="fa fa-fw fa-image action"></i>
        Assign Images
      </a>
    </li>
    <li>
      <a href="/promote/preview/${id}" target="_blank">
        <i class="fa fa-fw fa-external-link action"></i>
        Preview
      </a>
    </li>
  `
}