
function initContributorsTable (workflowStage, dtContributorsInit) {

  var contributorIndex = 1, successIndex = 2, crowdsourcingTemplateIndex = 3,
      curatorIndex = 4, customerIndex = 5, statusIndex = 6, actionsIndex = 7,
      storyPublishedIndex = 8;

  $('table[id="' + workflowStage + '-contributors-table"]').DataTable({
    ajax: {
      url: '/companies/' + app.company.id + '/contributions',
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
    order: [[ customerIndex, 'asc' ]],
    columns: [
      {
        data: null,
        render: function (data, type, row) {
            return "<i class='fa fa-caret-right'></i>" +
                   "<i class='fa fa-caret-down' style='display:none'></i>";
          }
      },
      {
        name: 'contributor',
        data: {
          _: function (row, type, set, meta) {
            return {
              id: row.contributor.id,
              fullName: row.contributor.full_name,
              contributionId: row.id,
              curatorId: row.success.curator.id
            };
          },
          display: 'contributor.full_name',
          filter: 'contributor.full_name'
        }
      },
      {  // <td data-search="s<%= contribution.success.id %>, <%= contribution.success.name %>">
        name: 'success',
        defaultContent: 'Customer Win',
        data: {
          _: function (row, type, set, meta) {
            return { id: row.success.id, name: row.success.name };
          },
          filter: 'success.name'
        }
      },
      // <td data-search="t<%#= contribution.crowdsourcing_template_id  %>" class='crowdsourcing-template'>
      {
        name: 'crowdsourcing_template',
        data: {
          _: 'crowdsourcing_template.id',
          display: 'crowdsourcing_template.name'
        },
        defaultContent: '<span class="placeholder">Select</span>'
      },

      {  // <td data-search="<%= contribution.success.curator.id %>"></td>
        name: 'curator',
        data: {
          _: 'success.curator.full_name',  // not used, but _ is required
          filter: 'success.curator.id'
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
        }
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
            return _.template( $('#contributor-actions-dropdown-template').html() )({
              status: data,
              workflowStage: workflowStage,
              story: row.success.story, // might be nil
              viewStoryPath: row.success.story && row.success.story.csp_story_path,
              curateStoryPath: row.success.story &&
                '/curate/' + row.success.customer.slug + '/' +
                row.success.story.slug
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
        visible: false,  },
      {
        targets: [0, actionsIndex],
        orderable: false,
        searchable: false,
      },
      { width: '0%', targets: [successIndex, curatorIndex, customerIndex, storyPublishedIndex] },
      { width: '5%', targets: 0 },
      { width: '32%', targets: [contributorIndex, crowdsourcingTemplateIndex] },
      { width: '21%', targets: statusIndex },
      { width: '10%', targets: actionsIndex }
    ],
    rowGroup: {
      dataSrc: 'success.name',
      startRender: function (groupRows, successName) {
        // customer and story (if exists) data same for all rows, so just look at [0]th row
        var customerSlug = groupRows.data()[0].success.customer.slug,
            customerName = groupRows.data()[0].success.customer.name,
            story = groupRows.data()[0].success.story,
            storySlug = story && story.slug,
            storyTitle = story && story.title,
            storyQuery = "/?csp_curate_story=contributors",
            storyPath = story && (story.published ? story.csp_story_path + storyQuery :
              '/curate/' + customerSlug + '/' + storySlug + storyQuery),
            link; // to success or story

        if (story) {
          link = '<span style="font-weight:600">' +
                   '<a href="' + storyPath + '" class="story">' +
                      storyTitle +
                   '</a>' + '\xa0\xa0(Customer Story)' +
                 '</span>';
        } else {
          link = '<span style="font-weight:600">' +
                   '<a href="javascript:;" class="success">' +
                      successName +
                   '</a>' + '\xa0\xa0(Customer Win)' +
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
      $(row).children().eq(0).addClass('contributor-details');
      $(row).children().eq(1).addClass('contributor');
      $(row).children().eq(2)
        .addClass('crowdsourcing-template')
        .append('<i class="fa fa-caret-down"></i>');
      $(row).children().eq(3).addClass('status');
      $(row).children().eq(4).addClass('dropdown actions-dropdown');

      // template can only be selected if status is in
      // (a) request hasn't been sent yet
      // (b) did not respond (ready for re-send)
      var statusDisplay = $(row).children().eq(3).text(),
          disableTemplateSelect = function (statusDisplay) {
            return !['awaiting request', 'did not respond'].some(function (status) {
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
          crowdsourcingTemplateSelectOptions =
              app.company.crowdsourcing_templates.map(function (template) {
                return { label: template.name, value: template.id };
              }),
          showTable = function () { $table.css('visibility', 'visible'); };

      // this is for the question mark icons that go with status= unsubscribe or opt_out
      $('[data-toggle="tooltip"]').tooltip();

      if (workflowStage === 'crowdsource') {

        // global so can be accessed from crowdsourceListeners
        crowdsourceContributorsEditor = newContributorsEditor(
          'crowdsource', crowdsourcingTemplateSelectOptions
        );

        $tableWrapper.prepend(
          _.template( $('#contributors-table-header-template').html() )({
            curators: app.company.curators,
            contributors: dt.column(contributorIndex).data(),
            successes: dt.column(successIndex).data(),
            customers: dt.column(customerIndex).data()
          })
        );

        dtContributorsInit.resolve();

      // workflowStage == curate
      // contributors under a Story don't have curator and filter selects
      } else {

        $(this).DataTable().column('success:name')
          .search( $('#curate-story-layout').data('success-name') )
          .draw();
        // global so can be accessed from crowdsourceListeners
        curateContributorsEditor = newContributorsEditor(
          'curate', crowdsourcingTemplateSelectOptions
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