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
    order: [[ colIndices.status, 'asc' ]],

    columns: [
      {
        data: null,
        render: (data: any, type: any, row: any) => {
          return ''
          // return `
          //   <button type="button" class="btn" data-action="promoted-story#toggleChildRow">
          //     <i class="fa fa-caret-right"></i>
          //     <i class="fa fa-caret-down"></i>
          //   </button>
          // `
        },
        // createdCell: (td: Node) => $(td).addClass('toggle-child')
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
              <input 
                type="checkbox"
                 class="bs-switch promote-control form-control"
                 name="story[topic_ad_attributes][status]"
                 value="ENABLED"
                 data-on-text="<i class='fa fa-fw fa-play'></i><i class='fa fa-fw fa-spin fa-circle-o-notch' style='display:none'></i><i class='fa fa-fw fa-check' style='display:none'></i>"
                 data-off-text="<span><i class='fa fa-fw fa-pause'></i><i class='fa fa-spin fa-circle-o-notch' style='display:none;'></i><i class='fa fa-fw fa-check' style='display:none'></i>"
                 ${ads_status === 'ENABLED' ? 'checked' : null}>
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
        data: 'id',
        render: (storyId, type, row, meta) => `
          <a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown">
            <i class="fa fa-caret-down" style="text-decoration:none;"></i>
          </a>
          <ul class="dropdown-menu dropdown-menu-right dropdown-actions">
          <li>
            <a data-toggle="modal" data-target="#ads-images-modal" role="button">
              <i class="fa fa-fw fa-image action"></i>&nbsp;&nbsp;
              <span>Assign Images</span>
            </a>
          </li>
          <li>
            <a href="/promote/preview/${storyId}" target="_blank">
              <i class="fa fa-fw fa-external-link action"></i>&nbsp;&nbsp;
              <span>Preview</span>
            </a>
          </li>
        `
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
      { targets: colIndices.status, width: '6em' },
      { targets: colIndices.actions, width: '4.5em' },
    ],

    createdRow: function (row, data, index) { 
      const { id, title } = data as PromotedStory;
      $(row)
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
          .eq(4)
            .addClass('actions dropdown')
            .end()
          // .end()
        // .prepend(`
        //   <td colspan="4" class="flash">
        //     <div style="position:relative">
        //       <button style="position: absolute; top: 0; right: 7px; font-size: 30px; cursor: pointer" type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        //       <span>Sorry, there was an error when updating the Promoted Story. Please contact</span>&nbsp;<a href="mailto:support@customerstories.net?subject=Error when updating a Promoted Story">support@customerstories.net</a>
        //     </div>
        //   </td>
        // `)
    },

  };
}