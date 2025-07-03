import type { Config, Api } from 'datatables.net-bs';

export function newContributionPath(customerWinId: string | number, params: URLSearchParams) {
  return `/successes/${customerWinId || '0'}/contributions/new${params.size > 0 ? `?${params}` : ''}`;
}

export function dataTableConfig(invitationTemplateSelectHtml: string, storyId?: number): Config {
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
          _: (row: Contribution, type: string, set: any) => row.invitation_template?.id || '',
          // display: 'invitation_template.name' || '',
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
        data: 'success.curator.id'
      },
      {
        name: 'customer',
        data: {
          _: 'success.customer.name',
          filter: 'success.customer.id',
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
      { targets: 0, width: '1.75em' },
      { targets: [colIndices.contributor, colIndices.invitationTemplate], width: 'auto' },
      { targets: colIndices.status, width: '10em' },
      { targets: colIndices.actions, width: '3.5em' }
    ],

    rowGroup: storyId ? undefined : { dataSrc: 'success.name', startRender: rowGroupTemplate },

    rowCallback(tr: Node, data: object) {
      const { id } = data as Contribution;
      // console.log('rowCallback ', id)
    },

    createdRow: (tr: Node, data: object | any[], index: number) => {
      const { 
        id, 
        status, 
        contributor, 
        invitation_template: invitationTemplate, 
        invitation,
        success: customerWin, 
        path } = data as Contribution;
      // console.log('createdRow ', id)
      $(tr)
      // .attr('data-datatable-target', 'row')
        .attr('data-contribution-datatable-outlet', storyId ? '#story-contributions-table' : '#contributions-table')
        .attr('data-contribution-resource-outlet', '#customer-wins')
        .attr(
          'data-contribution-row-data-value', 
          JSON.stringify({ id, status, contributor, invitationTemplate, invitation, customerWin, path })
        )
        .attr(
          'data-action', 
          'dropdown:dropdown-is-shown->contribution#onShownDropdown dropdown:dropdown-is-hidden->contribution#onHiddenDropdown'
        )
        .attr('data-controller', 'contribution')
        .attr(
          'data-contribution-child-row-turbo-frame-attrs-value', 
          JSON.stringify({ id: 'show-contribution', src: path })
        );
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
    <!-- <td><i class="fa fa-${story ? 'bullhorn' : 'rocket'}"></i></td> -->
    <td colspan="5">
      <div>
        <span>${customerWin.customer.name}</span>
        <span class="emdash">&nbsp;&nbsp;&#8211;&nbsp;&nbsp;</span>
        ${story ? 
          `<a href="${storyPath}">${storyTitle}</a>` :
          `<a href="javascript:;" data-action="dashboard#showContributionCustomerWin" data-customer-win-id="${customerWin.id}">${customerWinName}</a>`
        }
      </div>
    </td>
  `);
}

function actionsDropdownTemplate(row: Contribution, type: string, set: any) {
  const { id, status, invitation_template: invitationTemplate, invitation, success: customerWin, path } = row;
  const shouldShowStoryLinks = window.location.pathname === '/prospect';
  const storyExists = Boolean(customerWin?.story);
  const editStoryPath = storyExists ? `/stories/${customerWin?.story!.slug}/edit` : undefined;
  const isPreInvite = status === 'pre_request';
  const didNotRespond = status === 'did_not_respond';
  const wasSubmitted = status && status.includes('submitted');
  const invitationPath = path + `/contributor_invitation/${invitation ? 'edit' : 'new'}`;
  const viewStoryDropdownItem = !storyExists ? '' : `
      <li>
        <a href="${customerWin?.story!.csp_story_path}" data-turbo="false" target="_blank" rel="noopener">
          <i class="fa fa-search fa-fw action"></i>
          View Story
        </a>
      </li>
    `;
  const editStoryDropdownItems = [['story-settings', 'fa-gear'], ['story-content', 'fa-edit'], ['story-contributions', 'fa-users']]
    .map(([tab, icon]) => {
      const section = tab[tab.indexOf('-') + 1].toUpperCase() + tab.slice(tab.indexOf('-') + 2, tab.length);
      return `
        <li class="${tab}">
          <a href="javascript:;" data-action="dashboard#editStory" data-story-path="${editStoryPath}" data-story-tab="${tab}">
            <i class="fa ${icon} fa-fw action"></i>
            Customer Story ${section}
          </a>
        </li>
      `;
    })
    .join('');
  const viewCustomerWinDropdownItem = `
    <li class="view-success">
      <a href="javascript:;"}>
        <i class="fa fa-rocket fa-fw action"></i>
        View Customer Win
      </a>
    </li>
  `;
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
          href="${invitationPath}"
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
      ${shouldShowStoryLinks ? `
          ${customerWin?.story?.published ? 
              viewStoryDropdownItem + '<li role="separator" class="divider"></li>' : 
              ''
          }
          ${storyExists ? editStoryDropdownItems : viewCustomerWinDropdownItem}
          <li role="separator" class="divider"></li>
        ` : 
        ''
      }
      <li>
        <a href="javascript:;" data-action="contribution#deleteRow">
          <i class="fa fa-remove fa-fw action"></i>
          Delete
        </a>
      </li>
    </ul>
  `;
}
