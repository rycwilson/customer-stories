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
    
    order: [[colIndices.customer, 'asc'], [colIndices.contributor, 'asc']],

    columns: [
      {
        name: 'childRow',
        data: 'success.id',
        render: (data: any, type: any, row: any) => `
          <button type="button" class="btn">
            <i class="fa fa-caret-right"></i>
            <i class="fa fa-caret-down"></i>
          </button>
        `,
        createdCell: (td: Node) => $(td).addClass('toggle-child')
      },
      {
        name: 'contributor',
        data: {
          _: (row: Contribution, type: any, set: any) => ({
            id: row.contributor?.id,
            fullName: row.contributor?.full_name,
            contributionId: row.id,
            curatorId: row.success?.curator.id
          }),
          display: 'contributor.full_name',
          filter: 'contributor.id',
          sort: 'contributor.last_name'
        },
      },
      {
        name: 'success',
        defaultContent: 'Customer Win',
        data: {
          _: (row: Contribution, type: any, set: any) => ({ id: row.success?.id, name: row.success?.name }),
          filter: 'success.id',
          sort: 'success.name'
        }
      },
      // <td data-search="t<%#= contribution.invitation_template_id  %>" class='invitation-template'>
      {
        name: 'invitation_template',
        data: {
          _: 'invitation_template.id',
          display: 'invitation_template.name'
        },
        defaultContent: '<span class="placeholder">Select</span>',
        createdCell: (td: Node) => $(td).addClass('invitation-template')
      },

      {  // <td data-search="<%= contribution.success.curator.id %>"></td>
        name: 'curator',
        data: {
          _: (row: Contribution, type: any, set: any) => ({ id: row.success?.curator.id, fullName: row.success?.curator.full_name }),
          filter: 'success.curator.id'
        }
      },      // curator
       // <td data-search="c<%= contribution.customer.id %>"><%= contribution.customer.name %></td>
      {
        name: 'customer',
        data: {
          _: (row: Contribution, type: any, set: any) => ({ id: row.success?.customer.id, name: row.success?.customer.name }),
          filter: 'success.customer.id',
          sort: 'success.customer.name'
        },
        // orderData: [[colIndices.customer, 'asc'], [colIndices.success, 'asc'], [colIndices.contributor, 'desc']]
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
        data: 'status',
        render: (data: any, type: any, row: any) => '',
        createdCell: (td: Node) => {
          $(td)
            .addClass('dropdown')
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
        targets: [0, colIndices.actions],
        orderable: false,
      },
      {
        targets: [colIndices.actions],
        searchable: false,
      },
      // { targets: [colIndices.success, colIndices.curator, colIndices.customer, colIndices.storyPublished], width: '0%' },
      { targets: 0, width: '2em' },
      { targets: [colIndices.contributor, colIndices.invitationTemplate], width: 'auto' },
      { targets: colIndices.status, width: '10em' },
      { targets: colIndices.actions, width: '4.5em' }
    ],

    rowGroup: storyId ? undefined : { dataSrc: 'success.name', startRender: rowGroupTemplate },

    createdRow: (row: Node, data: object | any[], index: number) => {
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
      $(row)
        .attr('data-controller', 'contribution')
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