import type { Config, Api } from 'datatables.net-bs';

const colIndices = {
  contributor: 1,
  customer: 2,
  customerWin: 3,
  role: 4,
  curator: 5,
  status: 6,
  actions: 7,
  story: 8
};

export function toggleColumnVisibility(dt: Api<any>, rowGroupDataSource: string) {
  dt.column(colIndices.contributor)
    .visible(rowGroupDataSource !== 'contributor.full_name');
  dt.column(colIndices.customer)
    .visible(rowGroupDataSource !== 'customer.name' && rowGroupDataSource !== 'customer_win.name');
  dt.column(colIndices.customerWin)
    .visible(rowGroupDataSource !== 'customer_win.name');
  dt.column(colIndices.role)
    .visible(rowGroupDataSource !== 'invitation_template.name');
}

export function dataTableConfig(
  invitationTemplateSelectHtml: string,
  rowGroupDataSource: string,
  storyId?: number
): Config {
  const rowGroupColumn = storyId ? undefined : (() => {
    switch (rowGroupDataSource) {
      case 'contributor.full_name':
        return colIndices.contributor;
      case 'customer.name':
        return colIndices.customer;
      case 'customer_win.name':
        return colIndices.customerWin;
      case 'invitation_template.name':
        return colIndices.role;
      default:
        return undefined; // should not happen
    }
  })();
  return {
    data: storyId ? CSP['storyContributions'][storyId] : CSP.contributions,
    
    language: {
      emptyTable: 'No Contributors found',
      zeroRecords: 'No Contributors found'
    },

    order: (() => {
      switch (rowGroupDataSource) {
        case 'customer_win.name':
          return [[colIndices.customer, 'asc'], [colIndices.status, 'asc']];
        case '':
          return [[colIndices.status, 'asc']];
        default:
          return [[rowGroupColumn!, 'asc'], [colIndices.status, 'asc']]
      }
    })(),

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
        name: 'customer',
        data: {
          _: 'customer.name',
          filter: 'customer.id',
        },
      },
      {
        name: 'success',
        data: {
          _: 'customer_win.name',
          filter: 'customer_win.id',
        }
      },
      {
        name: 'role',
        data: {
          _: (row: Contribution, type: string, set: any) => {
            return row.invitation_template?.name?.match(/Customer|Customer\sSuccess|Sales/) ?
              row.invitation_template.name : 
              '';
          },
          // display: 'invitationTemplate.name' || '',
          display: (row: Contribution) => {
            return row.invitation_template?.name?.match(/Customer|Customer\sSuccess|Sales/) ?
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
        name: 'curator',
        data: 'curator.id'
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
          display: (row: Contribution) => actionsDropdownTemplate(transformSourceData(row))
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
        targets: (() => {
          const targets = [colIndices.curator, colIndices.story, rowGroupColumn].filter(col => col);  
          if (storyId) {
            return [...targets, colIndices.customer, colIndices.customerWin];
          } else if (rowGroupColumn === colIndices.customerWin) {
            return [...targets, colIndices.customer];
          }
          return targets;
        })() as number[],
        visible: false,
      },
      {
        targets: [0, colIndices.curator, colIndices.actions, colIndices.story],
        orderable: false,
      },
      {
        targets: [0, colIndices.role, colIndices.status, colIndices.actions],
        searchable: false,
      },
      { targets: 0, width: '1.75em' },
      { 
        targets: [
          colIndices.contributor, colIndices.customerWin, colIndices.customer
        ], 
        width: 'auto' 
      },
      { targets: colIndices.role, width: '9em' },
      { targets: colIndices.status, width: '10em' },
      { targets: colIndices.actions, width: '3.5em' }
    ],

    rowGroup: { 
      enable: !!rowGroupDataSource,
      dataSrc: rowGroupDataSource,

      // This function will run whenever the data source changes
      startRender: function (
        this: { dataSrc: () => string, s: { dt: Api<any> } },
        rows: Api<any>, 
        groupValue: string
      ) {
        const { dt } = this.s;
        const dataSource = this.dataSrc();
        const wrapper = (colspan: number, content: string) => (
          $('<tr />').append(`<td colspan="${colspan}"><div>${content}</div></td>`)
        );
        switch(dataSource) {
          case 'contributor.full_name': 
          case 'customer.name': {
            return wrapper(6, `<span>${groupValue}</span>`);
          }
          case 'customer_win.name': {
            const firstRowData: Contribution = rows.data()[0];
            const { customer, customer_win: win, story } = firstRowData;
            return wrapper(5, `
              <span>${customer!.name}</span>
              <span>&nbsp;&nbsp;&ndash;&nbsp;&nbsp;</span>
              ${story ? 
                `<a href="${story.edit_path}">${story.title}</a>` :
                `<a 
                  href="javascript:;"
                  data-action="dashboard#showContributionCustomerWin"
                  data-customer-win-id="${win!.id}">${win!.name}</a>`
              }
            `);
          }
          case 'invitation_template.name':
            return wrapper(
              6, 
              `Role: ${groupValue === 'No group' ? '<em>None specified</em>' : groupValue}`
            );
        }
      } 
    },

    rowCallback(tr: Node, data: object) {
      const { id } = data as Contribution;
      // console.log('rowCallback ', id)
    },

    createdRow: (tr: Node, data: object | any[], index: number) => {
      const rowData = transformSourceData(data as Contribution);
      $(tr)
      // .attr('data-datatable-target', 'row')
        .attr(
          'data-contribution-datatable-outlet',
          storyId ? '#story-contributions-table' : '#contributions-table'
        )
        .attr(
          'data-contribution-row-data-value', 
          JSON.stringify(rowData)
        )
        .attr(
          'data-contribution-child-row-turbo-frame-attrs-value', 
          JSON.stringify({ id: 'edit-contribution', src: rowData.editPath })
        )
        .attr('data-action', [
          'dropdown:dropdown-is-shown->contribution#onShownDropdown',
          'dropdown:dropdown-is-hidden->contribution#onHiddenDropdown',
          'click->contribution#openView'
        ].join(' '))
        .attr('data-controller', 'contribution');
    }
  }
}

// Transform source row data to `rowData` used by ContributionController
// This involves transformation to cameCase and filtering out unneeded fields
function transformSourceData(row: Contribution) {
  const rowData: ContributionRowData = {
    id: row.id,
    status: row.display_status!,
    path: row.path!,
    editPath: row.edit_path!,
  };
  if (row.invitation_template) rowData.invitationTemplate = row.invitation_template;
  if (row.invitation) rowData.invitation = row.invitation;
  return rowData;
}

export function actionsDropdownTemplate(rowData: ContributionRowData): string {
  const { id, status, invitationTemplate, invitation } = rowData;
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
