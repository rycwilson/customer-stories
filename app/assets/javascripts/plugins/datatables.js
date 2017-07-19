
function initDataTables () {


  // make sure daterangepicker is initialized prior to datatables,
  // else the prior selected date range will be used instead of default
  if ($('#measure-visitors-container').hasClass('active')) {
    $('a[href="#measure-visitors-container"]')[0].click();
  }
  if ($('#measure-stories-container').hasClass('active')) {
    $('a[href="#measure-stories-container"]')[0].click();
  }

  $('#customers-table').DataTable({
    paging: false,
    columnDefs: [
      { orderable: false, targets: [ 2 ] },
      { width: '160px', targets: 2 }
    ],
  });

  initSuccessesTable();
  initContributorsTable('crowdsource');
  // initSponsoredStoriesTable();

  $('#curate-table').DataTable({
    paging: false
  });


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
    paging: true,
    pageLength: 100,
    lengthChange: false,
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
        data: {
          _: 'name',
          filter: 'id'
        }
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
        data: null,
        render: function () {
                  return _.template(
                            $('#successes-dropdown-template').html()
                          )({});
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
      { width: '5%', targets: 0 },
      { width: '50%', targets: 1 },
      { width: '0%', targets: 2 },  // customer
      { width: '35%', targets: 3 },
      { width: '0%', targets: 4 },  // curator
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

      $(this).css('visibility', 'visible');
    }
  });
}

function initContributorsTable (workflowStage) {
  var successIndex = 2, curatorIndex = 4, customerIndex = 5, colCount = 8;
  $('[id="' + workflowStage + '-contributors-table"]').DataTable({
    ajax: {
      url: '/contributions',
      dataSrc: ''
    },
    paging: false,
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
        data: {
          _: 'contributor.full_name',
          filter: 'contributor.id'
        }
      },  // contributor
      // <td data-search="s<%= contribution.success.id %>, <%= contribution.success.name %>">
      {
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
      { name: 'email_template',
        data: 'email_template.name' },     // email template

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
        data: null,
        render: function () {
                  return _.template(
                            $('#contributors-dropdown-template').html()
                          )({});
                }
      },
    ],
    columnDefs: [
      { visible: false, targets: [ successIndex, curatorIndex, customerIndex ] },
      {
        targets: [0, colCount - 1],
        orderable: false,
        searchable: false,
        createdCell: function (td, cellData, rowData, row, col) {
          if (col === 0) {
            $(td).addClass('contributor-details');
          } else {
            $(td).addClass('dropdown actions-dropdown');
          }
        }
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
        return $('<tr/>').append(
                  '<td colspan="5">' +
                     '<span style="font-weight:600">' +
                        groupRows.data()[0].success.customer.name +
                     '</span>' +
                     '<span style="font-weight: normal">' +  // em-dash not bold
                       '&nbsp;&nbsp;&#8211;&nbsp;&nbsp;' +
                     '</span>' +
                     '<a href="javascript:;" class="success-name" style="font-weight:600">' +
                        successName +
                     '</a>' +
                  '</td>');
      }
    },
    createdRow: function (row, data, index) {
      $(row).attr('data-contribution-id', data.id);
      $(row).attr('data-success-id', data.success.id);
      $(row).attr('data-contributor-id', data.contributor.id);
    },
    // buttons: [
    //     { extend: 'create', editor: editor },
    //     { extend: 'edit',   editor: editor },
    //     { extend: 'remove', editor: editor }
    // ],
    // createdRow: function( row, data, dataIndex ) {
    //   if ( data[4] == "A" ) {
    //     $(row).addClass( 'important' );
    //   }
    // }
    // drawCallback: function (settings) {
    // },
    initComplete: function (settings, json) {
      var $tableWrapper = $(this).closest('[id*="table_wrapper"]'),
          template = _.template($('#contributors-table-header-template').html());

      // remove default search field.  Disabling via options also disables api, so can't do that
      $tableWrapper.children('.row:first-child').remove();

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
        contributorsEditor = new $.fn.dataTable.Editor({
          table: '#crowdsource-contributors-table',
          fields: [
            { name: 'contributor_details' },
            { name: 'contributor' },
            { name: 'story_candidate' },
            {
              label: "Email template:",
              name: "email_template",
              type: 'select',
              options: ['Choice 1', 'Choice 2', 'Choice 3']
            },
            { name: 'curator' },
            { name: 'customer' },
            { name: 'next_step' },
            { name: 'actions' }
          ]
        });

      // workflowStage == curate
      // contributors under a Story don't have curator and filter selects
      } else {
        var dt = $(this).DataTable(),
            curatorCol = $(this).data('curator-col'),
            curatorId = app.current_user.id,
            successCol = $(this).data('success-col'),
            successId = $('#story-settings-tab-pane').data('success-id');
            dt.columns(curatorCol).search(curatorId)
              .columns(successCol).search(successId)
              .draw();

      }
      $(this).css('visibility', 'visible');
    }
  });
}

function initSponsoredStoriesTable () {
  $('#sponsored-stories-table').DataTable({
    paging: false,
    columnDefs: [{
      orderable: false,
      targets: [ 2, 4 ]
    }]
  });
}