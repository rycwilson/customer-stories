function initContributorsTable(workflowStage, dtContributorsInit) {
  const indices = {
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
  $(`table[id="${workflowStage}-contributors-table"]`).DataTable({
    ajax: {
      url: successId ? `/successes/${successId}/contributions` : '/companies/0/contributions',
      dataSrc: ''
    },
    autoWidth: false,
    dom: 'tip',
    // select: true,  // https://datatables.net/extensions/select/
    pageLength: 100,
    language: {
      emptyTable: 'No Contributors found',
      zeroRecords: 'No Contributors found'
    },
    order: [[indices.customer, 'asc'], [indices.success, 'asc'], [indices.contributor, 'desc']],
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
          filter: 'contributor.full_name',
          sort: 'timestamp'  // contribution.created_at
        },
      },
      {
        name: 'success',
        defaultContent: 'Customer Win',
        data: {
          _: (row, type, set, meta) => ({ id: row.success.id, name: row.success.name }),
          filter: 'success.name',
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
          filter: 'success.customer.name',
          sort: 'success.customer.name'
        },
        // orderData: [[indices.customer, 'asc'], [indices.success, 'asc'], [indices.contributor, 'desc']]
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
        targets: [indices.success, indices.curator, indices.customer, indices.storyPublished],
        visible: false
      },
      {
        targets: [0, indices.actions],
        orderable: false,
      },
      {
        targets: [indices.actions],
        searchable: false,
      },
      { targets: [indices.success, indices.curator, indices.customer, indices.storyPublished], width: '0%' },
      { targets: 0, width: '5%' },
      { targets: [indices.contributor, indices.invitationTemplate], width: '33%' },
      { targets: indices.status, width: '22%' },
      { targets: indices.actions, width: '8%' }
    ],

    rowGroup: workflowStage === 'curate' ? null : {
      dataSrc: 'success.name',
      startRender: (groupRows, successName) => {
        // console.log(successName + ': ', groupRows);
        // customer and story (if exists) data same for all rows, so just look at [0]th row
        const customerSlug = groupRows.data()[0].success.customer.slug;
        const customerName = groupRows.data()[0].success.customer.name;
        const story = groupRows.data()[0].success.story;
        const storySlug = story && story.slug;
        const storyTitle = story && story.title;
        const storyPath = story && (story.published ? story.csp_story_path : `/curate/${customerSlug}/${storySlug}`);
        return $('<tr/>').append(`
          <td colspan="5">
            <span>${customerName}</span>
            <span class="emdash">&nbsp;&nbsp;&#8211;&nbsp;&nbsp;</span>
            ${story ? 
              `<a href="${storyPath}" class="story">${storyTitle}</a>` :
              `<a href="javascript:;" class="success">${successName}</a>`
            }
          </td>
        `);
      }
    },

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

    initComplete: async function (settings, json) {
      const $table = $(this);
      const $tableWrapper = $table.closest('[id*="table_wrapper"]');
      const dt = $table.DataTable();
      const getInvitationTemplates = async () => {
        // company will be found by subdomain
        const response = await fetch('/companies/0/invitation_templates');
        return response.json();  
      }
      const invitationTemplates = await getInvitationTemplates();
      const invitationTemplateSelectOptions = invitationTemplates.map(template => ( 
        { label: template.name, value: template.id }
      ));

      // this is for the question mark icons that go with status= opt_out or remove
      $('[data-toggle="tooltip"]').tooltip();

      if (workflowStage === 'prospect') {
        // global so can be accessed from prospectListeners
        prospectContributorsEditor = newContributorsEditor('prospect', invitationTemplateSelectOptions);
        dtContributorsInit.resolve();

      // workflowStage == curate
      // contributors under a Story don't have curator and filter selects
      } else {
        // global so can be accessed from prospectListeners
        curateContributorsEditor = newContributorsEditor('curate', invitationTemplateSelectOptions);

        // no row grouping for curate-contributors
        if ($table.attr('id').includes('curate')) {
          $table.addClass('table-striped').find('tr.group').remove();
        }

        $table.css('visibility', 'visible');
      }
      $('.working--prospect').addClass('contributors-loaded');
      $tableWrapper.find('.dataTables_paginate').show();
    }
  });

  function actionsDropdownTemplate(status, rowData, workflowStage) {
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
      <ul class='contributor-actions dropdown-menu dropdown-menu-right dropdown-actions'>
        <li class="${isPreInvite ? `compose-invitation ${invitationTemplate ? '' : 'disabled'}` : 'view-request'}">
          <a href="javascript:;">
            <i class="fa fa-${isPreInvite ? 'envelope' : 'search'} fa-fw action"></i>&nbsp;&nbsp;
            <span>${isPreInvite ? 'Compose Invitation' : 'View Sent Invitation'}</span>
          </a>
        </li>
        ${didNotRespond ? `
            <li class="re-send-invitation">
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
}