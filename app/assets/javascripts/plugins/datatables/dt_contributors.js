
function initContributorsTable (workflowStage) {

  var successIndex = 2, curatorIndex = 4, customerIndex = 5, colCount = 8;

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
    order: [[ successIndex, 'asc' ]],
    columns: [
      { // td.contributor-details
        data: null,
        render: function (data, type, row) {
                  return "<i class='fa fa-caret-right'></i>" +
                         "<i class='fa fa-caret-down' style='display:none'></i>";
                }
      },
      { // td.contributor-name
        name: 'contributor',
        data: 'contributor.full_name'
      },
      {  // <td data-search="s<%= contribution.success.id %>, <%= contribution.success.name %>">
        name: 'success',
        defaultContent: 'Unknown Opportunity',
        data: {
          _: 'success.name',
          filter: 'success.id'
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
        data: 'success.customer.name'
      },
      // <td class='contribution-status'>
      {
        name: 'status',
        data: 'display_status'
      },
      {
        // data is status as this will determine actions available
        // TODO: error
        data: 'status',
        render: function (data, type, row, meta) {
          return _.template(
              $('#contributors-dropdown-template').html()
            )({
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
    ],
    columnDefs: [
      {
        targets: [successIndex, curatorIndex, customerIndex],
        visible: false,  },
      {
        targets: [0, colCount - 1],
        orderable: false,
        searchable: false,
      },
      { width: '0%', targets: [2, 4, 5] },  // success, curator, customer
      { width: '5%', targets: 0 },
      { width: '32%', targets: [1, 3] },  // contributor, template
      { width: '21%', targets: 6 },  // status
      { width: '10%', targets: 7 }
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
            storyPath = story && (story.published ? story.csp_story_path :
              '/curate/' + customerSlug + '/' + storySlug),
            link; // to success or story

        if (story) {
          link = '<span style="font-weight:600">' +
                   '<a href="' + storyPath + '" class="story">' +
                      storyTitle +
                   '</a>' + '\xa0\xa0(Story)' +
                 '</span>';
        } else {
          link = '<span style="font-weight:600">' +
                   '<a href="javascript:;" class="success">' +
                      successName +
                   '</a>' + '\xa0\xa0(Story Candidate)' +
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
      $(row).children().eq(0).addClass('contributor-details');
      $(row).children().eq(1).addClass('contributor');
      $(row).children().eq(2)
        .addClass('crowdsourcing-template')
        .append('<i class="fa fa-caret-down"></i>');
      $(row).children().eq(3).addClass('status');
      $(row).children().eq(4).addClass('dropdown actions-dropdown');
      // don't allow selection of crowdsourcing template if request has been sent
      if ( $(row).children().eq(3).text().includes('sent') ) {
        $(row).children().eq(2).addClass('disabled').find('i').remove();
      }
    },

    initComplete: function (settings, json) {
      var $tableWrapper = $(this).closest('[id*="table_wrapper"]'),
          tableHeaderTemplate = _.template($('#contributors-table-header-template').html()),
          crowdsourcingTemplateSelectOptions =
              app.company.crowdsourcing_templates.map(function (template) {
                return { label: template.name, value: template.id };
              });

      // this is for the question mark icons that go with status= unsubscribe or opt_out
      $('[data-toggle="tooltip"]').tooltip();

      if (workflowStage === 'crowdsource') {

        // global so can be accessed from crowdsourceListeners
        crowdsourceContributorsEditor = newContributorsEditor(
          'crowdsource', crowdsourcingTemplateSelectOptions
        );

        $tableWrapper.prepend(
          tableHeaderTemplate({
            curators: app.company.curators,
            contributors: _.pluck(app.contributions, 'contributor'),
            successes: app.company.successes,
            customers: app.company.customers,
            selectWidth: 250
          })
        );
        var $curatorSelect = $tableWrapper.find('.curator-select');
        $curatorSelect.select2({
          theme: 'bootstrap',
          width: 'style',
          minimumResultsForSearch: -1   // hides text input
        });
        // select2 is inserting an empty <option> for some reason
        $tableWrapper.find('.curator-select > option').not('[value]').remove();
        $('#contributors-filter').select2({
          theme: 'bootstrap',
          width: 'style'
          // placeholder: 'type or select'
          // allowClear: true
        });

        $curatorSelect.val( app.current_user.id.toString() )
          .trigger('change', { auto: true });

      // workflowStage == curate
      // contributors under a Story don't have curator and filter selects
      } else {

        // use regex search to prevent search of '18' from matching '185', '218', etc
        $(this).DataTable().column('success:name')
          .search('^' + $('#curate-story-layout').data('success-id') + '$', true, false)
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

      }
      // $('#' + workflowStage + ' a[href="#' + workflowStage + '-contributors"]')
      //   .find('.fa-spinner').hide();
      $(this).css('visibility', 'visible');
    }
  });
}