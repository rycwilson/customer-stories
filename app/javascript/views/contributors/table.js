import { initTableControls, cloneFilterResults, toggleRowGroups, redrawRowGroups } from '../dashboard/tables.js';
import { actionsDropdownTemplate, handleDropdownAction, showContribution } from './actions.js';

let tableControls, tableWrapper, table, dt;

export default {
  init(contributions) {
    // console.log('init contributors', contributions)
    table = document.getElementById('prospect-contributors-table');
    dt = initDataTable(contributions);
  },
  addListeners() {
    document.addEventListener('change', (e) => {
      if (e.target.id === 'group-by-customer-win') toggleRowGroups(table);
    })
    document.addEventListener('click', (e) => { 
      const isDropdownAction = e.target.closest('.actions.dropdown > ul.contributor-actions') && e.target.role !== 'separator';
      const isShowContribution = e.target.id && e.target.id.includes('show-contribution');
      if (isDropdownAction || isShowContribution) {
        const row = dt.row(e.target.closest('tr'));
        if (isDropdownAction) handleDropdownAction(e.target, row); 
        if (isShowContribution) showContribution(row.data().id);
      }
    });
    document.addEventListener('click', onRowGroupCustomerWinLinkClick);
    document.addEventListener('click', onRowGroupStoryLinkClick);
  }
}

function initDataTable(contributions, workflowStage = 'prospect') {
  const colIndices = {
    contributor: 1,
    success: 2,
    invitationTemplate: 3,
    curator: 4,
    customer: 5,
    status: 6,
    actions: 7,
    storyPublished: 8
  }
  const storyContainer = (workflowStage === 'curate') && document.querySelector('#edit-story-layout');
  const successId = storyContainer && storyContainer.dataset.successId;
  table = document.getElementById(`${workflowStage}-contributors-table`);
  tableWrapper = table.parentElement;
  tableControls = table.previousElementSibling;
  rowGroupsCheckbox = tableControls.querySelector('#group-by-customer-win');
  showCompletedCheckbox = tableControls.querySelector('#show-completed');
  showPublishedCheckbox = tableControls.querySelector('#show-published');
  return new DataTable(`table[id="${workflowStage}-contributors-table"]`, {
    // ajax: {
    //   url: successId ? `/successes/${successId}/contributions` : '/companies/0/contributions',
    //   dataSrc: ''
    // },
    data: contributions,
    autoWidth: false,
    dom: 'tip',
    // select: true,  // https://datatables.net/extensions/select/
    pageLength: 100,
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
        render: (data, type, row, meta) => actionsDropdownTemplate(data, row, workflowStage)
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

    rowGroup: workflowStage === 'curate' ? null : { dataSrc: 'success.name', startRender: rowGroupTemplate },

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
    },

    initComplete: async function (settings) {
      // console.log('settings', settings)
      // const dt = this.api()
      tableWrapper = table.parentElement;
      tableControls = tableWrapper.previousElementSibling;
      initTableControls(tableControls, tableWrapper, table);
      cloneFilterResults(tableControls, tableWrapper, table);

      // const getInvitationTemplates = async () => {
      //   // company will be found by subdomain
      //   const response = await fetch('/companies/0/invitation_templates');
      //   return response.json();  
      // }
      // const invitationTemplates = await getInvitationTemplates();
      // const invitationTemplateSelectOptions = invitationTemplates.map(template => ( 
      //   { label: template.name, value: template.id }
      // ));

      // this is for the question mark icons that go with status= opt_out or remove
      // $('[data-toggle="tooltip"]').tooltip();


      // contributors under a Story don't have curator and filter selects
      if (workflowStage === 'curate') {
        // global so can be accessed from prospectListeners
        // curateContributorsEditor = newContributorsEditor('curate', invitationTemplateSelectOptions);

        // no row grouping for curate-contributors
        // if (table.id.includes('curate')) {
        //   table.classList.add('table-striped')
        //   table.querySelectorAll('tr.group').forEach(rowGroup => rowGroup.remove());
        // }
      }
      // $('.working--prospect').addClass('contributors-loaded');
      // $tableWrapper.find('.dataTables_paginate').show();
    },
    
    drawCallback(settings) {
      redrawRowGroups(tableControls, this.api().rowGroup());
    }
  });
}

function rowGroupTemplate(groupRows, successName) {
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

function onRowGroupCustomerWinLinkClick(e) {
  const rowGroupLink = e.target.id && e.target.id.includes('contributors-row-group-link-cw-') && e.target;
  if (rowGroupLink) {
    e.stopPropagation();  // prevent row group sorting 
    const successId = rowGroupLink.id.slice(rowGroupLink.id.lastIndexOf('-') + 1, rowGroupLink.id.length);
    $('a[href="#successes"]').tab('show');
    document.getElementById('successes-filter').tomselect.setValue(`success-${successId}`);
  }
}

function onRowGroupStoryLinkClick(e) {
  const rowGroupLink = e.target.id && e.target.id.includes('contributors-row-group-link-story-') && e.target;
  if (rowGroupLink) {
    e.preventDefault();   // turbo link (see below)
    e.stopPropagation();  // prevent row group sorting 
    Cookies.set('csp-edit-story-tab', '#story-contributors');
    Turbo.visit(rowGroupLink.href);
  }
}