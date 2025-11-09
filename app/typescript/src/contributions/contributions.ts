import type { Config, Api } from 'datatables.net-bs';

export function dataTableConfig(
  invitationTemplateSelectHtml: string,
  rowGroupDataSrc?: string,
  storyId?: number
): Config {
  const colIndices = {
    contributor: 1,
    customerWin: 2,
    role: 3,
    customer: 4,
    status: 5,
    actions: 6,
    story: 7
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
          sort: 'contributor.last_name',
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
        name: 'role',
        data: {
          _: (row: Contribution, type: string, set: any) => {
            return row.invitation_template?.name?.match(/Customer|Customer Success|Sales/) ?
              row.invitation_template.name : 
              '';
          },
          // display: 'invitationTemplate.name' || '',
          display: (row: Contribution) => {
            return row.invitation_template?.name?.match(/Customer|Customer Success|Sales/) ?
              row.invitation_template.name :
              '<span style="color:#ccc">\u2014</span>';
            // return row.invitation_template ? 
            //   invitationTemplateSelectHtml.replace(
            //     `<option value="${row.invitation_template.id}">`, 
            //     `<option value="${row.invitation_template.id}" selected>`
            //   ) :
            //   invitationTemplateSelectHtml;
          },

          // NOTE: This may not work when a function is used to define default data (_ property)
          // sort: (row: Contribution, type: string, set: any) => {
          //   console.log(row)
          //   return row.invitation_template?.name || 'zzz'
          // }
        },
        // defaultContent: '<span class="placeholder">Select</span>',
        // createdCell: function (this: JQuery<HTMLTableElement, any>, td: Node) {
        //   $(td)
        //     .addClass('invitation-template')
        //     .css('height', '0')   // does not change height, but allows for 100% height of the td's child element
        // }
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
          colIndices.customerWin, colIndices.customer, colIndices.story
        ],
        visible: false
      },
      {
        targets: [
          0, colIndices.customerWin, colIndices.customer, colIndices.actions, colIndices.story
        ],
        orderable: false,
      },
      {
        targets: [0, colIndices.role, colIndices.status, colIndices.actions],
        searchable: false,
      },
      // { targets: [colIndices.customerWin, colIndices.customer, colIndices.story], width: '0%' },
      { targets: 0, width: '1.75em' },
      { targets: [colIndices.contributor, colIndices.role], width: 'auto' },
      { targets: colIndices.status, width: '10em' },
      { targets: colIndices.actions, width: '3.5em' }
    ],

    rowGroup: storyId || (rowGroupDataSrc === undefined) ? 
      undefined : 
      { 
        dataSrc: rowGroupDataSrc, 
        startRender: (rows: Api<any>, groupValue: string) => {
          let html;
          if (rowGroupDataSrc === 'customer.name') {
            html = `<span>${groupValue}</span>`
          } else if (rowGroupDataSrc === 'customer_win.name') {
            const firstRowData: Contribution = rows.data()[0];
            const { customer, customer_win: win, story } = firstRowData;
            html = `
              <span>${customer!.name}</span>
              <span>&nbsp;&nbsp;&ndash;&nbsp;&nbsp;</span>
              ${story ? 
                `<a href="${story.edit_path}">${story.title}</a>` :
                `<a 
                  href="javascript:;" 
                  data-action="dashboard#showContributionCustomerWin"
                  data-customer-win-id="${win!.id}">${win!.name}</a>`
              }
            `
          } else if (rowGroupDataSrc === 'invitation_template.name') {
            html = `Role: ${groupValue || '<em>None specified</em>'}`;
            if (!groupValue) {
              html = '<span>No Template Selected</span>';
            } else {
              html = `<span>Template: ${groupValue}</span>`;
            }
          }
          return $('<tr />').append(`<td colspan="5"><div>${html}</div></td>`);
        } 
      },

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
        path,
        edit_path: editPath 
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
          JSON.stringify({ id, status, invitationTemplate, story, path, editPath })
        )
        .attr('data-action', [
          'dropdown:dropdown-is-shown->contribution#onShownDropdown',
          'dropdown:dropdown-is-hidden->contribution#onHiddenDropdown'
        ].join(' '))
        .attr('data-controller', 'contribution')
        .attr(
          'data-contribution-child-row-turbo-frame-attrs-value', 
          JSON.stringify({ id: 'edit-contribution', src: editPath })
        );
    }
  }
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
