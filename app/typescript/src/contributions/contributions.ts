import type { Config, Api } from 'datatables.net-bs';

export function dataTableConfig(invitationTemplateSelectHtml: string, storyId?: number): Config {
  const colIndices = {
    contributor: 1,
    customerWin: 2,
    invitationTemplate: 3,
    curator: 4,
    customer: 5,
    status: 6,
    actions: 7,
    story: 8
  };
  return {
    data: storyId ? CSP['storyContributions'][storyId] : CSP.contributions,
    // select: true,  // https://datatables.net/extensions/select/
    
    language: {
      emptyTable: 'No Contributors found',
      zeroRecords: 'No Contributors found'
    },
    
    orderFixed: [colIndices.customerWin, 'asc'],  // the row grouping column (all sorting will happen secondarily to this)
    order: [[colIndices.status, 'asc']],

    columns: [
      {
        name: 'contribution',
        data: 'id',
        render: (contributionId: number, type: string, row: Contribution) => {
          const toggleBtn = `
            <button type="button" class="btn" data-action="contribution#toggleChildRow">
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
          _: 'contributor.full_name',
          // display: 'contributor.full_name',
          // sort: 'contributor.last_name'
          filter: 'contributor.id'
        },
      },
      {
        name: 'win',
        data: {
          _: 'customer_win.name',
          filter: 'customer_win.id',
        }
      },
      {
        name: 'invitationTemplate',
        data: {
          _: (row: Contribution, type: string, set: any) => row.invitation_template?.id || '',
          // display: 'invitationTemplate.name' || '',
          display: (row: Contribution) => {
            return row.invitation_template ? row.invitation_template.name : '';
            // return row.invitation_template ? 
            //   invitationTemplateSelectHtml.replace(
            //     `<option value="${row.invitation_template.id}">`, 
            //     `<option value="${row.invitation_template.id}" selected>`
            //   ) :
            //   invitationTemplateSelectHtml;
          },
          sort: (row: Contribution, type: string, set: any) => row.invitation_template?.name || ''
        },
        // defaultContent: '<span class="placeholder">Select</span>',
        // createdCell: function (this: JQuery<HTMLTableElement, any>, td: Node) {
        //   $(td)
        //     .addClass('invitation-template')
        //     .css('height', '0')   // does not change height, but allows for 100% height of the td's child element
        // }
      },

      { 
        name: 'curator',
        data: 'curator.id'
      },
      {
        name: 'customer',
        data: {
          _: 'customer.name',
          filter: 'customer.id',
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
        data: {
          _: 'status',
          display: actionsDropdownTemplate
        },
        createdCell: (td: Node) => $(td).attr('data-controller', 'dropdown')
      },
      {
        name: 'story',
        data: {
          _: 'story.published',
        },
        defaultContent: 'false'
      },
    ],

    columnDefs: [
      {
        targets: [
          colIndices.customerWin, colIndices.curator, colIndices.customer, colIndices.story
        ],
        visible: false
      },
      {
        targets: [
          0, colIndices.customerWin, colIndices.curator, colIndices.customer, colIndices.actions, colIndices.story
        ],
        orderable: false,
      },
      {
        targets: [0, colIndices.invitationTemplate, colIndices.status, colIndices.actions],
        searchable: false,
      },
      // { targets: [colIndices.customerWin, colIndices.curator, colIndices.customer, colIndices.story], width: '0%' },
      { targets: 0, width: '1.75em' },
      { targets: [colIndices.contributor, colIndices.invitationTemplate], width: 'auto' },
      { targets: colIndices.status, width: '10em' },
      { targets: colIndices.actions, width: '3.5em' }
    ],

    rowGroup: storyId ? undefined : { dataSrc: 'customer_win.name', startRender: rowGroupTemplate },

    rowCallback(tr: Node, data: object) {
      const { id } = data as Contribution;
      // console.log('rowCallback ', id)
    },

    createdRow: (tr: Node, data: object | any[], index: number) => {
      const { 
        id, 
        status, 
        invitation_template: invitationTemplate, 
        story, 
        path 
      } = data as Contribution;
      $(tr)
      // .attr('data-datatable-target', 'row')
        .attr(
          'data-contribution-datatable-outlet',
          storyId ? '#story-contributions-table' : '#contributions-table'
        )
        .attr('data-contribution-resource-outlet', '#customer-wins')
        .attr(
          'data-contribution-row-data-value', 
          JSON.stringify({ id, status, invitationTemplate, story, path })
        )
        .attr('data-action', [
          'dropdown:dropdown-is-shown->contribution#onShownDropdown',
          'dropdown:dropdown-is-hidden->contribution#onHiddenDropdown'
        ].join(' '))
        .attr('data-controller', 'contribution')
        .attr(
          'data-contribution-child-row-turbo-frame-attrs-value', 
          JSON.stringify({ id: 'show-contribution', src: path })
        );
    }
  }
}

function rowGroupTemplate(rows: Api<any>, group: string) {
  const customerWinName = group;
  const { customer, customer_win: win, story } = rows.data()[0]; // all rows will share these values, can sample first
  return $('<tr/>').append(`
    <!-- <td><i class="fa fa-${story ? 'bullhorn' : 'rocket'}"></i></td> -->
    <td colspan="5">
      <div>
        <span>${customer.name}</span>
        <span class="emdash">&nbsp;&nbsp;&#8211;&nbsp;&nbsp;</span>
        ${story ? 
          `<a href="${story.edit_path}">${story.title}</a>` :
          `<a 
             href="javascript:;" 
             data-action="dashboard#showContributionCustomerWin"
             data-customer-win-id="${win.id}">${win.name}</a>`
        }
      </div>
    </td>
  `);
}

function actionsDropdownTemplate(row: Contribution, type: string, set: any) {
  const { id, status, invitation_template: invitationTemplate, invitation } = row;
  const isPreInvite = status === 'pre_request';
  const didNotRespond = status === 'did_not_respond';
  const wasSubmitted = status && status.includes('submitted');
  return `
    <a id="contributions-action-dropdown-${id}" 
      href="#" 
      class="dropdown-toggle" 
      data-toggle="dropdown"
      aria-haspopup="true" 
      aria-expanded="false">
      <i style="font-size:1.15em" class="fa fa-ellipsis-v"></i>
    </a>
    <ul 
      class="contributor-actions dropdown-menu dropdown-menu-right" 
      data-dropdown-target="dropdownMenu"
      aria-labelledby="contributions-action-dropdown-${id}">
      <li class="${isPreInvite && !invitationTemplate ? 'disabled' : ''}">
        <a 
          href="${invitation?.path}"
          data-turbo-stream="true" 
          data-controller="modal-trigger" 
          data-modal-trigger-modal-outlet="#main-modal"
          data-modal-trigger-enabled-value="${invitation || invitationTemplate ? 'true' : 'false'}"
          data-modal-trigger-params-value='${JSON.stringify({ title: 'Contributor Invitation', className: 'contributor-invitation' })}'
          data-action="modal-trigger#beforeFetchModalContent">
          <i class="fa fa-${isPreInvite ? 'envelope-o' : 'search'} fa-fw action"></i>
          ${isPreInvite ? 'Compose Invitation' : 'View Sent Invitation'}
        </a>
      </li>
      ${didNotRespond ? `
          <li class="resend-invitation">
            <a href="javascript:;">
              <i class="fa fa-envelope fa-fw action"></i>
              Re-send Invitation
            </a>
          </li>
        ` : ''
      }
      ${wasSubmitted ? `
          <li>
            <a href="javascript:;" data-action="contribution#markAsCompleted">
              <i class="fa fa-check fa-fw action"></i>
              Mark as completed

            </a>
          </li>
        ` : ''
      }
      <li role="separator" class="divider"></li>
      <!-- TODO: link to stories#edit with contributor shown> -->
      <li>
        <a href="javascript:;" data-action="contribution#deleteRow">
          <i class="fa fa-remove fa-fw action"></i>
          Delete
        </a>
      </li>
    </ul>
  `;
}
