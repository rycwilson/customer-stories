import { Controller } from "@hotwired/stimulus"
import { searchTable } from '../actions/tables.js';
import { getJSON } from '../util.js';

export default class extends Controller {
  static targets = ['rowGroupsCheckbox', 'filterCheckbox', 'curatorSelect', 'filterSelect', 'datatable'];
  static values = { dataPath: String };

  static contributions = [];

  initialize() {
  }

  connect() {
    // console.log('connect contributors')
    getJSON(this.dataPathValue).then(contributions => {
      this.contributions = contributions;
      console.log('contributions: ', contributions)
      this.datatableTarget.setAttribute('data-datatable-ready-value', 'true');
      const panel = this.element.closest('[data-dashboard-target="tabPanel"]');
      this.dispatch('load', { detail: { panel, resourceClassName: 'contributors' }})
    });
  }

  searchTable(e = { detail: {} }) {
    searchTable.bind(this)(e.detail.searchResults);
  }

  tableInitComplete(e) {
    this.searchTable();
  }

  toggleRowGroups() {
    this.datatableTarget.setAttribute('data-datatable-enable-row-groups-value', this.rowGroupsCheckbox.checked);
  }

  tableConfig() {
    const workflowStage = 'prospect';
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
      data: this.contributions,
      // select: true,  // https://datatables.net/extensions/select/
      
      language: {
        emptyTable: 'No Contributors found',
        zeroRecords: 'No Contributors found'
      },
      
      order: [[colIndices.customer, 'asc'], [colIndices.success, 'asc'], [colIndices.contributor, 'desc']],
  
      columns: [
        {
          name: 'childRow',
          data: 'success.id',
          render: (data, type, row) => `
            <i class="fa fa-caret-right"></i>
            <i class="fa fa-caret-down" style="display:none"></i>
          `
        },
        {
          name: 'contributor',
          data: {
            _: (row, type, set, meta) => ({
              id: row.contributor.id,
              fullName: row.contributor.full_name,
              contributionId: row.id,
              curatorId: row.success.curator.id
            }),
            display: 'contributor.full_name',
            filter: 'contributor.id',
            sort: 'timestamp'  // contribution.created_at
          },
        },
        {
          name: 'success',
          defaultContent: 'Customer Win',
          data: {
            _: (row, type, set, meta) => ({ id: row.success.id, name: row.success.name }),
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
          defaultContent: '<span class="placeholder">Select</span>'
        },
  
        {  // <td data-search="<%= contribution.success.curator.id %>"></td>
          name: 'curator',
          data: {
            _: (row, type, set, meta) => ({ id: row.success.curator.id, fullName: row.success.curator.full_name }),
            filter: 'success.curator.id'
          }
        },      // curator
         // <td data-search="c<%= contribution.customer.id %>"><%= contribution.customer.name %></td>
        {
          name: 'customer',
          data: {
            _: (row, type, set, meta) => ({ id: row.success.customer.id, name: row.success.customer.name }),
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
          }
        },
        {
          // data is status as this will determine actions available
          data: 'status',
          render: (data, type, row, meta) => this.actionsDropdownTemplate(data, row, workflowStage)
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
        { targets: [colIndices.success, colIndices.curator, colIndices.customer, colIndices.storyPublished], width: '0%' },
        { targets: 0, width: '5%' },
        { targets: [colIndices.contributor, colIndices.invitationTemplate], width: '33%' },
        { targets: colIndices.status, width: '22%' },
        { targets: colIndices.actions, width: '8%' }
      ],
  
      rowGroup: workflowStage === 'curate' ? null : { dataSrc: 'success.name', startRender: this.rowGroupTemplate },
  
      createdRow: (row, data, index) => {
        const isPreInvite = data.status === 'pre_request';
        const didNotRespond = data.status === 'did_not_respond';
        $(row)
          .attr('data-contribution-id', data.id)
          .attr('data-success-id', data.success.id)
          .attr('data-contributor-id', data.contributor.id)
          .children()
            .eq(0).addClass('toggle-contributor-child').end()
            .eq(1).addClass('contributor').end()
            .eq(2)
              .addClass('invitation-template')
              .addClass(isPreInvite || didNotRespond ? '' : 'disabled')
              .append(isPreInvite || didNotRespond ? '<i class="fa fa-caret-down"></i>' : '')
              .end()
            .eq(3).addClass('status').end()
            .eq(4).addClass('actions dropdown')
      }
    }
  }

  actionsDropdownTemplate(status, rowData, workflowStage) {
    const isPreInvite = rowData.status === 'pre_request';
    const invitationTemplate = rowData.invitation_template;
    const didNotRespond = rowData.status === 'did_not_respond';
    const wasSubmitted = rowData.status && rowData.status.includes('submitted');
    const story = rowData.success.story;
    const viewStoryPath = story && story.csp_story_path;
    const editStoryPath = story && `/curate/${rowData.success.customer.slug}/${rowData.success.story.slug}`;
    const storyActions = [['story-settings', 'fa-gear'], ['story-content', 'fa-edit'], ['story-contributors', 'fa-users']]
      .map(([className, icon]) => {
        const section = (
          className[className.indexOf('-') + 1].toUpperCase() + 
          className.slice(className.indexOf('-') + 2, className.length)
        )
        return `
          <li class="${className}">
            <a href="${editStoryPath}">
              <i class="fa ${icon} fa-fw action"></i>&nbsp;&nbsp;
              <span>Customer Story ${section}</span>
            </a>
          </li>
        `;
      }).join('');
    return `
      <a href="javascript:;" class="dropdown-toggle" data-toggle='dropdown'>
        <i class="fa fa-caret-down"></i>
      </a>
      <ul class="contributor-actions dropdown-menu dropdown-menu-right dropdown-actions">
        <li class="${isPreInvite ? `compose-invitation ${invitationTemplate ? '' : 'disabled'}` : 'view-request'}">
          <a href="javascript:;">
            <i class="fa fa-${isPreInvite ? 'envelope' : 'search'} fa-fw action"></i>&nbsp;&nbsp;
            <span>${isPreInvite ? 'Compose Invitation' : 'View Sent Invitation'}</span>
          </a>
        </li>
        ${didNotRespond ? `
            <li class="resend-invitation">
              <a href="javascript:;">
                <i class="fa fa-envelope fa-fw action"></i>&nbsp;&nbsp;
                <span>Re-send Invitation</span>
              </a>
            </li>
          ` : ''
        }
        ${wasSubmitted ? `
            <li class="completed">
              <a href="javascript:;">
                <i class="fa fa-check fa-fw action"></i>&nbsp;&nbsp;
                <span>Mark as completed</span>
              </a>
            </li>
          ` : ''
        }
        <li role="separator" class="divider"></li>
        ${workflowStage === 'prospect' ? `
            ${story && story.published ? `
                <li>
                  <a href="${viewStoryPath}"}>
                    <i class="fa fa-search fa-fw action"></i>&nbsp;&nbsp;
                    <span>View Story</span>
                  </a>
                </li>
                <li role="separator" class="divider"></li>
              ` : ''
            }
            ${story ? storyActions : `
                <li class="view-success">
                  <a href="javascript:;"}>
                    <i class="fa fa-rocket fa-fw action"></i>&nbsp;&nbsp;
                    <span>View Customer Win</span>
                  </a>
                </li>
              `
            }
            <li role="separator" class="divider"></li>
          ` : ''
        }
        <li class="remove">
          <a href="javascript:;">
            <i class="fa fa-remove fa-fw action"></i>&nbsp;&nbsp;
            <span>Remove</span>
          </a>
        </li>
      </ul>
    `;
  }

  rowGroupTemplate(groupRows, successName) {
    // console.log(successName + ': ', groupRows);
    // customer and story (if exists) data same for all rows, so just look at [0]th row
    const success = groupRows.data()[0].success;
    const story = success.story;
    const storySlug = story && story.slug;
    const storyTitle = story && story.title;
    const storyPath = story && (story.published ? story.csp_story_path : `/curate/${success.customer.slug}/${storySlug}`);
    return $('<tr/>').append(`
      <td colspan="5">
        <span>${success.customer.name}</span>
        <span class="emdash">&nbsp;&nbsp;&#8211;&nbsp;&nbsp;</span>
        ${story ? 
          `<a href="${storyPath}" id="contributors-row-group-link-story-${story.id}">${storyTitle}</a>` :
          `<a href="javascript:;" id="contributors-row-group-link-cw-${success.id}">${successName}</a>`
        }
      </td>
    `);
  }
}