import type { Config, Api } from 'datatables.net-bs';

export function newContributionPath(customerWinId: string | number, params: URLSearchParams) {
  return `/successes/${customerWinId || '0'}/contributions/new${params.size > 0 ? `?${params}` : ''}`;
}

export function tableConfig(storyId?: number): Config {
  const colIndices = {
    contributor: 1,
    success: 2,
    invitationTemplate: 3,
    curator: 4,
    customer: 5,
    status: 6,
    actions: 7,
    storyPublished: 8
  };
  return {
    data: storyId ? CSP['storyContributions'][storyId] : CSP.contributions,
    // select: true,  // https://datatables.net/extensions/select/
    
    language: {
      emptyTable: 'No Contributors found',
      zeroRecords: 'No Contributors found'
    },
    
    orderFixed: [colIndices.success, 'asc'],  // the row grouping column (all sorting will happen secondarily to this)
    order: [[colIndices.status, 'asc']],

    columns: [
      {
        name: 'contribution',
        data: 'id',
        render: (contributionId: number, type: string, row: Contribution) => {
          const toggleBtn = `
            <button type="button" class="btn" data-action="contribution#onClickChildRowBtn">
              <i class="fa fa-caret-right"></i>
              <i class="fa fa-caret-down"></i>
            </button>
          `;
          return type === 'display' ? toggleBtn : contributionId
        },
        createdCell: (td) => $(td).addClass('toggle-child')
      },
      {
        name: 'contributor',
        data: {
          _: (row: Contribution, type: string, set: any) => 'contributor.id',
          display: 'contributor.full_name',
          sort: 'contributor.last_name'
        },
      },
      {
        name: 'success',
        data: {
          _: 'success.name',
          filter: 'success.id',
        }
      },
      {
        name: 'invitation_template',
        data: {
          _: 'invitation_template.id',
          display: 'invitation_template.name',
          sort: 'invitation_template.name'
        },
        defaultContent: '<span class="placeholder">Select</span>',
        createdCell: (td: Node) => $(td).addClass('invitation-template')
      },

      { 
        name: 'curator',
        data: 'success.curator.id'
      },
      {
        name: 'customer',
        data: {
          _: (row: Contribution, type: string, set: any) => 'success.customer.id',
          sort: 'success.customer.name'
        },
      },
      {
        name: 'status',
        data: {
          _: 'status',
          display: 'display_status'
        },
        createdCell: (td: Node) => $(td).addClass('status')
      },
      {
        // data is status as this will determine actions available
        name: 'actions',
        data: 'status',
        render: (data: any, type: any, row: any) => '',
        createdCell: (td: Node) => {
          $(td)
            .attr('data-controller', 'actions-dropdown')
            .attr('data-contribution-target', 'actionsDropdown');
        }
      },
      {
        name: 'storyPublished',
        data: 'success.story.published',
        defaultContent: 'false'
      },
    ],

    columnDefs: [
      {
        targets: [colIndices.success, colIndices.curator, colIndices.customer, colIndices.storyPublished],
        visible: false
      },
      {
        targets: [0, colIndices.success, colIndices.curator, colIndices.customer, colIndices.actions, colIndices.storyPublished],
        orderable: false,
      },
      {
        targets: [0, colIndices.invitationTemplate, colIndices.status, colIndices.actions],
        searchable: false,
      },
      // { targets: [colIndices.success, colIndices.curator, colIndices.customer, colIndices.storyPublished], width: '0%' },
      { targets: 0, width: '2em' },
      { targets: [colIndices.contributor, colIndices.invitationTemplate], width: 'auto' },
      { targets: colIndices.status, width: '10em' },
      { targets: colIndices.actions, width: '4.5em' }
    ],

    rowGroup: storyId ? undefined : { dataSrc: 'success.name', startRender: rowGroupTemplate },

    createdRow: (tr: Node, data: object | any[], index: number) => {
      // const isPreInvite = data.status === 'pre_request';
      // const didNotRespond = data.status === 'did_not_respond';
      // $(row)
      //   .attr('data-contribution-id', data.id)
      //   .attr('data-success-id', data.success.id)
      //   .attr('data-contributor-id', data.contributor.id)
      //   .children()
      //     .eq(0).addClass('toggle-contributor-child').end()
      //     .eq(1).addClass('contributor').end()
      //     .eq(2)
      //       .addClass('invitation-template')
      //       .addClass(isPreInvite || didNotRespond ? '' : 'disabled')
      //       .append(isPreInvite || didNotRespond ? '<i class="fa fa-caret-down"></i>' : '')
      //       .end()
      //     .eq(3).addClass('status').end()
      //     .eq(4).addClass('actions dropdown')

      const { id, status, contributor, invitation_template: invitationTemplate, success: customerWin } = data as Contribution;
      $(tr)
        .attr('data-controller', 'contribution')
        .attr('data-contribution-datatable-outlet', storyId ? '#story-contributors-table' : '#contributors-table')
        .attr('data-contribution-resource-outlet', '#customer-wins')
        .attr('data-customer-win-modal-outlet', '#main-modal')
        .attr(
          'data-contribution-row-data-value', JSON.stringify({ id, status, contributor, invitationTemplate, customerWin })
        )
        // .attr('data-datatable-target', 'row')
        // .attr(
        //   'data-contribution-child-row-turbo-frame-attrs-value', 
        //   JSON.stringify({ id: 'edit-contribution', src: editContributionPath(id) })
        // );
    }
  }
}

function rowGroupTemplate(rows: Api<any>, group: string) {
  // customer and story (if exists) data same for all rows, so just look at [0]th row
  const customerWinName = group;
  const customerWin = rows.data()[0].success;
  const story = customerWin.story;
  const storySlug = story?.slug;
  const storyTitle = story?.title;
  const storyPath = `/stories/${storySlug}/edit`;
  return $('<tr/>').append(`
    <td colspan="5">
      <span>${customerWin.customer.name}</span>
      <span class="emdash">&nbsp;&nbsp;&#8211;&nbsp;&nbsp;</span>
      ${story ? 
        `<a href="${storyPath}">${storyTitle}</a>` :
        `<a href="javascript:;" data-action="dashboard#showContributionCustomerWin" data-customer-win-id="${customerWin.id}">${customerWinName}</a>`
      }
    </td>
  `);
}