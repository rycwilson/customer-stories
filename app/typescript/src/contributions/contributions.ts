import type { Config, Api } from 'datatables.net-bs';
import { minifyHtml } from '../utils';

enum Cols {
  Contributor = 1,
  Customer,
  Win,
  Role,
  Curator,
  Status,
  Actions,
  Story
}

export function toggleColumnVisibility(dt: Api<any>, rowGroupDataSource: string) {
  dt.column(Cols.Contributor)
    .visible(rowGroupDataSource !== 'contributor.full_name');
  dt.column(Cols.Customer)
    .visible(rowGroupDataSource !== 'customer.name' && rowGroupDataSource !== 'customer_win.name');
  dt.column(Cols.Win)
    .visible(rowGroupDataSource !== 'customer_win.name');
  dt.column(Cols.Role)
    .visible(rowGroupDataSource !== 'invitation_template.name');
}

export function dataTableConfig(
  invitationTemplateSelectHtml: string,
  rowGroupDataSource: string,
  storyId?: number
): Config {
  if (!CSP.contributions) console.error('Contributions data is not defined');

  const rowGroupColumn = storyId ? undefined : (() => {
    switch (rowGroupDataSource) {
      case 'contributor.full_name':
        return Cols.Contributor;
      case 'customer.name':
        return Cols.Customer;
      case 'customer_win.name':
        return Cols.Win;
      case 'invitation_template.name':
        return Cols.Role;
      default:
        return undefined; // should not happen
    }
  })();

  return {
    data: storyId ? 
      CSP['storyContributions'][storyId] :

      // Since table rows are generated dynamically and their associated actions dropdown
      // is derived from the row's status, the actions dropdown template is provided in this file.
      // To avoid repetition in the server and increased payload, and because the dropdown html
      // will also be required when rendering row views, merge with the server data here.
      // Use snake case to alisgn with server data convention.
      CSP.contributions?.map(contribution => ({ 
        ...contribution,
        actions_dropdown_html: actionsDropdownTemplate(contribution) 
      })) || [],
    
    language: {
      emptyTable: 'No Contributors found',
      zeroRecords: 'No Contributors found'
    },

    order: (() => {
      switch (rowGroupDataSource) {
        case 'customer_win.name':
          return [[Cols.Customer, 'asc'], [Cols.Status, 'asc']];
        case '':
          return [[Cols.Status, 'asc']];
        default:
          return [[rowGroupColumn!, 'asc'], [Cols.Status, 'asc']]
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
        targets: (() => {
          const targets = [Cols.Curator, Cols.Story, rowGroupColumn].filter(col => col);  
          if (storyId) {
            return [...targets, Cols.Customer, Cols.Win];
          } else if (rowGroupColumn === Cols.Win) {
            return [...targets, Cols.Customer];
          }
          return targets;
        })() as number[],
        visible: false,
      },
      {
        targets: [0, Cols.Curator, Cols.Actions, Cols.Story],
        orderable: false,
      },
      {
        targets: [0, Cols.Role, Cols.Status, Cols.Actions],
        searchable: false,
      },
      { targets: 0, width: '1.75em' },
      { 
        targets: [
          Cols.Contributor, Cols.Win, Cols.Customer
        ], 
        width: 'auto' 
      },
      { targets: Cols.Role, width: '9em' },
      { targets: Cols.Status, width: '10em' },
      { targets: Cols.Actions, width: '3.5em' }
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

    createdRow: (tr: Node, data: any[] | object, index: number, cells: Node[]) => {
      const rowData = transformSourceData(data as Contribution);
      $(tr)
        .attr(
          'data-contribution-datatable-outlet',
          storyId ? '#story-contributions-table' : '#contributions-table'
        )
        .attr('data-contribution-row-data-value', JSON.stringify(rowData))
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
    turboFrame: { id: 'edit-contribution', src: row.edit_path! }
  };
  if (row.invitation_template) rowData.invitationTemplate = row.invitation_template;
  if (row.invitation) rowData.invitation = row.invitation;
  return rowData;
}

export function actionsDropdownTemplate(
  contribution: Contribution, 
  type?: string,
  s?: undefined,
  meta?: { row: number, col: number, settings: object }
): string {
  const { id, status, invitationTemplate, invitation } = transformSourceData(contribution);
  const isPreInvite = status === 'pre_request';
  const didNotRespond = status === 'did_not_respond';
  const wasSubmitted = status && status.includes('submitted');
  return minifyHtml(`
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
  `);
}
