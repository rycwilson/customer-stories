
function initContributorsTable (workflowStage, dtContributorsInit) {

  var contributorIndex = 1, successIndex = 2, invitationTemplateIndex = 3,
      curatorIndex = 4, customerIndex = 5, statusIndex = 6, actionsIndex = 7,
      storyPublishedIndex = 8,
      successId, contributionsPath;

  if (workflowStage === 'prospect') {
    contributionsPath = '/companies/' + CSP.company.id + '/contributions';
  } else {
    successId = $('#curate-story-layout').data('success-id');
    contributionsPath = '/successes/' + successId + '/contributions';
  }

  $('table[id="' + workflowStage + '-contributors-table"]').DataTable({
    ajax: {
      url: contributionsPath,
      dataSrc: ''
    },
    dom: 'tip',
    // select: true,  // https://datatables.net/extensions/select/
    pageLength: 100,
    autoWidth: false,
    language: {
      emptyTable: 'No Contributors found',
      zeroRecords: 'No Contributors found'
    },
    order: [[customerIndex, 'asc'], [successIndex, 'asc'], [contributorIndex, 'desc']],
    columns: [
      {
        name: 'childRow',
        data: 'success.id',
        render: function (data, type, row) {
            return "<i class='fa fa-caret-right'></i>" +
                   "<i class='fa fa-caret-down' style='display:none'></i>";
          }
      },
      {
        name: 'contributor',
        data: {
          _: function (row, type, set, meta) {
            // console.log(row)
            return {
              id: row.contributor.id,
              fullName: row.contributor.full_name,
              contributionId: row.id,
              curatorId: row.success.curator.id
            };
          },
          display: 'contributor.full_name',
          filter: 'contributor.full_name',
          sort: 'timestamp'  // contribution.created_at
        },
      },
      {
        name: 'success',
        defaultContent: 'Customer Win',
        data: {
          _: function (row, type, set, meta) {
            return { id: row.success.id, name: row.success.name };
          },
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
          _: function (row, type, set, meta) {
            return { id: row.success.curator.id, fullName: row.success.curator.full_name };
          },
          filter: 'success.curator.id',
        }
      },      // curator
       // <td data-search="c<%= contribution.customer.id %>"><%= contribution.customer.name %></td>
      {
        name: 'customer',
        data: {
          _: function (row, type, set, meta) {
            return { id: row.success.customer.id, name: row.success.customer.name };
          },
          filter: 'success.customer.name',
          sort: 'success.customer.name'
        },
        // orderData: [[customerIndex, 'asc'], [successIndex, 'asc'], [contributorIndex, 'desc']]
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
        render: function (data, type, row, meta) {
          // console.log(row)
            return _.template( $('#contributor-actions-dropdown-template').html() )({
              status: data,
              workflowStage: workflowStage,
              invitationTemplate: row.invitation_template,
              story: row.success.story, // might be nil
              viewStoryPath: row.success.story && row.success.story.csp_story_path,
              editStoryPath: row.success.story && '/curate/' + row.success.customer.slug + '/' + row.success.story.slug
            });
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
        targets: [successIndex, curatorIndex, customerIndex, storyPublishedIndex],
        visible: false
      },
      {
        targets: [0, actionsIndex],
        orderable: false,
      },
      {
        targets: [actionsIndex],
        searchable: false,
      },
      { width: '0%', targets: [successIndex, curatorIndex, customerIndex, storyPublishedIndex] },
      { width: '5%', targets: 0 },
      { width: '33%', targets: [contributorIndex, invitationTemplateIndex] },
      { width: '22%', targets: statusIndex },
      { width: '8%', targets: actionsIndex }
    ],

    rowGroup: workflowStage === 'curate' ? null : {
      dataSrc: 'success.name',
      startRender: function (groupRows, successName) {
        // console.log(successName + ': ', groupRows);
        // customer and story (if exists) data same for all rows, so just look at [0]th row
        var customerSlug = groupRows.data()[0].success.customer.slug,
            customerName = groupRows.data()[0].success.customer.name,
            story = groupRows.data()[0].success.story,
            storySlug = story && story.slug,
            storyTitle = story && story.title,
            storyPath = story &&
              (story.published ? story.csp_story_path : '/curate/' + customerSlug + '/' + storySlug),
            link; // to success or story

        if (story) {
          link = '<span style="font-weight:600">' +
                   '<a href="' + storyPath + '" class="story">' +
                      storyTitle +
                   '</a>' + '\xa0\xa0<span style="font-weight:normal;font-size:12px">(Customer Story)</span>' +
                 '</span>';
        } else {
          link = '<span style="font-weight:600">' +
                   '<a href="javascript:;" class="success">' +
                      successName +
                   '</a>' + '\xa0\xa0<span style="font-weight:normal;font-size:12px">(Customer Win)</span' +
                 '</span>';
        }
        return $('<tr/>').append(
            '<td colspan="5">' +
               '<span style="font-weight:600">' +
                  customerName +
               '</span>' +
               '<span style="font-weight: normal">' +  // em-dash not bold
                 '&nbsp;&nbsp;&#8211;&nbsp;&nbsp;' +
               '</span>' +
               link +
            '</td>'
          );
      }
    },
    createdRow: function (row, data, index) {
      $(row).attr('data-contribution-id', data.id);
      $(row).attr('data-success-id', data.success.id);
      $(row).attr('data-contributor-id', data.contributor.id);
      // note: these indices won't align with *index variables,
      // as these are only the unhidden columns
      // $(row).children().eq(0).attr('data-filter', data.success.id);
      $(row).children().eq(0).addClass('contributor-details');
      $(row).children().eq(1).addClass('contributor');
      $(row).children().eq(2)
        .addClass('invitation-template')
        .append('<i class="fa fa-caret-down"></i>');
      $(row).children().eq(3).addClass('status');
      $(row).children().eq(4).addClass('actions dropdown');

      // template can only be selected if status is in
      // (a) request hasn't been sent yet
      // (b) did not respond (ready for re-send)
      var statusDisplay = $(row).children().eq(3).text(),
          disableTemplateSelect = function (statusDisplay) {
            return !['waiting', 'did not respond'].some(function (status) {
              return statusDisplay.includes(status);
            });
          };
      if ( disableTemplateSelect(statusDisplay) ) {
        $(row).children().eq(2).addClass('disabled').find('i').remove();
      }
    },

    initComplete: function (settings, json) {
      var $table = $(this),
          $tableWrapper = $table.closest('[id*="table_wrapper"]'),
          dt = $table.DataTable(),
          invitationTemplateSelectOptions =
              CSP.company.invitation_templates.map(function (template) {
                return { label: template.name, value: template.id };
              }),
          showTable = function () { $table.css('visibility', 'visible'); };

      // this is for the question mark icons that go with status= opt_out or remove
      $('[data-toggle="tooltip"]').tooltip();

      if (workflowStage === 'prospect') {
        // global so can be accessed from prospectListeners
        prospectContributorsEditor = newContributorsEditor(
          'prospect', invitationTemplateSelectOptions
        );
        dtContributorsInit.resolve();

      // workflowStage == curate
      // contributors under a Story don't have curator and filter selects
      } else {
        // global so can be accessed from prospectListeners
        curateContributorsEditor = newContributorsEditor(
          'curate', invitationTemplateSelectOptions
        );

        // no row grouping for curate-contributors
        if ($(this).attr('id').includes('curate')) {
          $(this).find('tr.group').remove();
        }
        // since no row grouping, add .table-striped
        $(this).addClass('table-striped');

        showTable();

      }

    }
  });
}