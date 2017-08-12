
function initDataTables () {

  // make sure daterangepicker is initialized prior to datatables,
  // else the prior selected date range will be used instead of default
  if ($('#measure-visitors-container').hasClass('active')) {
    $('a[href="#measure-visitors-container"]')[0].click();
  }
  if ($('#measure-stories-container').hasClass('active')) {
    $('a[href="#measure-stories-container"]')[0].click();
  }

  // if curator signed in ...
  if (app.company) {
    initSuccessesTable();
    initContributorsTable('crowdsource');
    initContributorsTable('curate');
    initPromotedStoriesTable();
  }

  // Don't specify first column as type: 'date'
  // with moment.js install, doing so will only screw it up
  $('#story_views-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null, null
    ]
  });
  $('#stories_published-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null
    ]
  });
  $('#contributions_submitted-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null
    ]
  });
  $('#contribution_requests_received-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null
    ]
  });
  $('#stories_logo_published-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null
    ]
  });
  $('#stories_created-table:not(.short)').DataTable({
    order: [0, 'desc'],
    columns: [
      { type: 'datetime-moment' }, null, null, null
    ]
  });

}

// TODO: <tr data-success-id="<%= success.id %>">
function initSuccessesTable () {
  var customerIndex = 2, curatorIndex = 4, colCount = 6;
  $('#successes-table').DataTable({
    ajax: {
      url: '/successes',
      dataSrc: ''
    },
    dom: 'tip',
    pageLength: 100,
    order: [[ customerIndex, 'asc' ]],
    columns: [
      { // td.success-details
        data: null,
        render: function (data, type, row) {
                  return "<i class='fa fa-caret-right'></i>" +
                         "<i class='fa fa-caret-down' style='display:none'></i>";
                }
      },
      {  // success
        name: 'success',
        data: 'name'
      },
      {  // customer
        name: 'customer',
        data: 'customer.name'
      },
      {  // next step
        render: function () {
          return '<span>Next step</span>';
        }
      },
      {  // curator
        name: 'curator',
        data: {
          _: 'curator.full_name',
          filter: 'curator.id'
        }
      },
      {  // td.dropdown.actions-dropdown
        data: 'contributions_count',
        render: function (data, type, row, meta) {
                  return _.template(
                            $('#successes-dropdown-template').html()
                          )({ contributionsCount: data });
                }
      }
    ],
    columnDefs: [
      { visible: false, targets: [customerIndex, curatorIndex] },
      {
        targets: [0, colCount - 1],
        orderable: false,
        searchable: false,
        createdCell: function (td, cellData, rowData, row, col) {
          if (col === 0) {
            $(td).addClass('success-details');
          } else {
            $(td).addClass('dropdown actions-dropdown');
          }
        }
      },
      { width: '0%', targets: [2, 4] },  // customer, curator
      { width: '5%', targets: 0 },
      { width: '50%', targets: 1 },
      { width: '35%', targets: 3 },
      { width: '10%', targets: 5 }
    ],
    rowGroup: {
      dataSrc: 'customer.name',
      startRender: function (groupRows, successName) {
        // console.log($(this))   //  [RowGroup]
        return $('<tr/>').append(
                  '<td colspan="4">' +
                     '<span style="font-weight:600">' +
                        groupRows.data()[0].customer.name +
                     '</span>' +
                  '</td>');
      }
    },
    createdRow: function (row, data, index) {
      $(row).attr('data-customer-id', data.customer.id);
      $(row).attr('data-success-id', data.id);
    },
    // drawCallback: function (settings) {
    // },
    initComplete: function (settings, json) {
      var $tableWrapper = $(this).closest('[id*="table_wrapper"]'),
          template = _.template( $('#successes-table-header-template').html() );

      // remove default search field.  Disabling via options also disables api, so can't do that
      $tableWrapper.children('.row:first-child').remove();

      $tableWrapper.prepend(
        template({
          currentUser: app.current_user,
          curators: app.company.curators,
          customers: app.company.customers,
          successes: app.company.successes,
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
      $curatorSelect.children('option').not('[value]').remove();

      $('#successes-filter').select2({
        theme: 'bootstrap',
        width: 'style'
        // allowClear: true
      });

      $curatorSelect.val( app.current_user.id.toString() )
          .trigger('change', { auto: true });

      // $('#crowdsource a[href="#successes"]').find('.fa-spinner').hide();
      $(this).css('visibility', 'visible');
    }
  });
}

function initContributorsTable (workflowStage) {
  var successIndex = 2, curatorIndex = 4, customerIndex = 5, colCount = 8;
  $('table[id="' + workflowStage + '-contributors-table"]').DataTable({
    ajax: {
      url: '/contributions',
      dataSrc: ''
    },
    dom: 'tip',
    // select: true,  // https://datatables.net/extensions/select/
    pageLength: 100,
    autoWidth: false,
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
        data: 'success.name',
        // render: {
        //   _: 'success.name',
        //   display: function (data, type, contributionRow, meta) {
        //   // console.log(data)
        //   // console.log(type)
        //   // console.log(contributionRow)
        //   // console.log(meta)
        //           return "<span style='font-weight:600'>" +
        //                     contributionRow.success.customer.name +
        //                  "</span>&nbsp;&nbsp;&#8211;&nbsp;&nbsp;" +
        //                  "<a href='javascript:;' class='success-name'>" +
        //                     contributionRow.success.name +
        //                  "</a>";}
        // }
      },           // story candidate
      // <td data-search="t<%#= contribution.email_template_id  %>" class='email-template'>
      {
        name: 'email_template',
        data: 'email_template.name',     // email template
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
        name: 'next_step',
        data: 'status'
        // render: function (data, type, row) {} },
        // <td class='dropdown actions-dropdown'>
      },
      {
        data: 'status',
        render: function (data, type, row, meta) {
                  return _.template(
                            $('#contributors-dropdown-template').html()
                          )({
                              status: data,
                              workflowStage: workflowStage,
                              story: row.success.story  // might be nil
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
      { width: '30%', targets: [1, 3] },
      { width: '25%', targets: 6 },
      { width: '10%', targets: 7 }
    ],
    rowGroup: {
      dataSrc: 'success.name',
      startRender: function (groupRows, successName) {
        // console.log($(this))   //  [RowGroup]
        // console.log(groupRows.data())
        var link; // link to either the success or story (if story exists)
        if (groupRows.data()[0].success.story) {
          link = '<span style="font-weight:600">' +
                   '<a href="/curate/' + groupRows.data()[0].success.story.slug + '" class="story">' +
                      groupRows.data()[0].success.story.title +
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
                        groupRows.data()[0].success.customer.name +
                     '</span>' +
                     '<span style="font-weight: normal">' +  // em-dash not bold
                       '&nbsp;&nbsp;&#8211;&nbsp;&nbsp;' +
                     '</span>' +
                     link +
                  '</td>');
      }
    },
    createdRow: function (row, data, index) {
      $(row).attr('data-contribution-id', data.id);
      $(row).attr('data-success-id', data.success.id);
      $(row).attr('data-contributor-id', data.contributor.id);
      // make sure to skip the hidden columns (2, 4, 5)
      $(row).children().eq(0).addClass('contributor-details');
      $(row).children().eq(1).addClass('contributor');
      // $(row).children().eq(2).addClass('success');
      $(row).children().eq(2).addClass('email-template');
      // $(row).children().eq(4).addClass('curator');
      // $(row).children().eq(5).addClass('customer');
      $(row).children().eq(3).addClass('next-step');
      $(row).children().eq(4).addClass('dropdown actions-dropdown');
    },
    // buttons: [
    //     { extend: 'create', editor: editor },
    //     { extend: 'edit',   editor: editor },
    //     { extend: 'remove', editor: editor }
    // ],
    // drawCallback: function (settings) {
    // },
    initComplete: function (settings, json) {
      var $tableWrapper = $(this).closest('[id*="table_wrapper"]'),
          template = _.template($('#contributors-table-header-template').html());

      // remove default search field.  Disabling via options also disables api, so can't do that
      // $tableWrapper.children('.row:first-child').remove();

      if (workflowStage === 'crowdsource') {
        $tableWrapper.prepend(
          template({
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

        // need to put this in the global space so it can be seen by
        // functions in crowdsourceListeners()
        // NOTE: skip the hidden columns
        contributorsEditor = new $.fn.dataTable.Editor({
          ajax: '/contributions',
          table: '#crowdsource-contributors-table',
          idSrc: 'id',
          fields: [
            { name: 'contributor_details' },
            { name: 'contributor' },
            // { name: 'success' },
            {
              label: 'Select an email template',
              name: 'email_template.name',  // should match columns.data
              type: 'select2',
              options: app.company.email_templates.map(function (template) {
                          return { label: template.name, value: template.id };
                        })
            },
            // { name: 'curator' },
            // { name: 'customer' },
            { name: 'next_step' },
            { name: 'actions' }
          ]
        });

      // workflowStage == curate
      // contributors under a Story don't have curator and filter selects
      } else {

        $(this).DataTable()
          .column('curator:name').search(app.current_user.id)
          .column('success:name').search($('#story-settings').data('success-name'))
          .draw();

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

function initPromotedStoriesTable () {
  $('#promoted-stories-table').DataTable({
    ajax: {
      url: '/companies/' + app.company.id.toString() + '/stories/promoted',
      dataSrc: ''
    },
    dom: 'tfi',
    columns: [
      {
        name: 'status',
        data: 'ads_status',
        render: function (data, type, row) {
          return '<div style="position: relative">' +
                   _.template($('#adwords-status-dropdown-template').html())({
                     promoteEnabled: app.company.promote_tr,
                     adsEnabled: data['ads_enabled?']
                   }) +
                 '</div>';
        }
      },
      {
        name: 'customer',
        data: 'success.customer.name'
      },
      {
        name: 'long_headline',
        data: 'ads_long_headline'
      },
      {
        name: 'image_url',
        data: 'ads_image_url',
        render: function (image_url, type, row, meta) {
          return '<div class="fileinput fileinput-exists" data-provides="fileinput">' +
                   '<div class="fileinput-preview thumbnail">' +
                     '<img src="' + image_url + '" alt="sponsored story image">' +
                   '</div>' +
                   '<input type="file" name="image_url" id="image_url" class="hidden" ' +
                 '</div>';
        }
      },
      {
        data: null,
        render: function (data, type, row, meta) {
          return '<a href="javascript:;"><i class="glyphicon glyphicon-new-window"></i></a>';
        }
      },
    ],
    columnDefs: [
      {
        targets: [2, 4],
        orderable: false
      },
      {
        targets: [0, 2, 4],
        searchable: false
      }
    ],
    createdRow: function (row, data, index) {
      $(row).attr('data-story-id', data.id);
      $(row).children().eq(0).addClass('dropdown status-dropdown');
      $(row).children().eq(1).addClass('promoted-story-customer');
      $(row).children().eq(2).addClass('promoted-story-title')
                             .attr('data-title', data.title);
      $(row).children().eq(3).addClass('promoted-story-image');
      $(row).children().eq(4).addClass('promoted-story-preview');
    },
    initComplete: function (settings, json) {
      proStoriesEditor = new $.fn.dataTable.Editor({
        ajax: 'stories',   // TODO: '/stories/' + storyId + '/promote'
        table: '#promoted-stories-table',
        idSrc: 'id',
        fields: [
          { name: 'status' },
          { name: 'customer.name' },
          // { name: 'success' },
          {
            label: 'Story title:',
            name: 'ads_long_headline',  // should match columns.data
            type: 'textarea',
          },
          // { name: 'curator' },
          // { name: 'customer' },
          { name: 'ads_image' },
          { name: 'actions' }
        ]
      });
    },
    preSubmit: function () {
    }
  });
}