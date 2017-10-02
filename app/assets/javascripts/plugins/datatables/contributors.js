
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
      // <td data-search="t<%#= contribution.crowdsourcing_template_id  %>" class='crowdsourcing-template'>
      {
        name: 'crowdsourcing_template',
        data: 'crowdsourcing_template.name',
        defaultContent: '<span style="color: #999">Select</span>'
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
        data: 'display_status',
        render: function (data, type, row) {
                  // debugger;
                  console.log(data)
                  return data;
                },
      },
      {
        // data is status as this will determine actions available
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
      { width: '33%', targets: [1, 3] },  // contributor, template
      { width: '19%', targets: 6 },  // status
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
                   '<a href="/curate/' + groupRows.data()[0].success.customer.slug + '/' +
                      groupRows.data()[0].success.story.slug + '" class="story">' +
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
      $(row).children().eq(2).addClass('crowdsourcing-template');
      // $(row).children().eq(4).addClass('curator');
      // $(row).children().eq(5).addClass('customer');
      $(row).children().eq(3).addClass('status');
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

      // this is for the question mark icons that go with status= unsubscribe or opt_out
      $('[data-toggle="tooltip"]').tooltip();

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
          ajax: 'companies/' + app.company.id + '/contributions',
          table: '#crowdsource-contributors-table',
          idSrc: 'id',
          fields: [
            { name: 'contributor_details' },
            { name: 'contributor' },
            // { name: 'success' },
            {
              label: 'Select a template',
              name: 'crowdsourcing_template.name',  // should match columns.data
              type: 'select2',
              options: app.company.crowdsourcing_templates.map(function (template) {
                          return { label: template.name, value: template.id };
                        })
            },
            // { name: 'curator' },
            // { name: 'customer' },
            { name: 'status' },
            { name: 'actions' }
          ]
        });

      // workflowStage == curate
      // contributors under a Story don't have curator and filter selects
      } else {

        $(this).DataTable()
          .column('curator:name').search(app.current_user.id)
          .column('success:name').search($('#curate-story-layout').data('success-name'))
          .draw();

        // no row grouping for curate-contributors
        if ($(this).attr('id').includes('curate')) {
          $(this).find('tr.group').remove();
        }
        // since no row grouping, add .table-striped
        $(this).addClass('table-striped');

        // populate the new contributor modal select box
        // $.ajax({
        //   url: '/companies/' + app.company.id + '/contribuions',
        //   method: 'get',
        //   data: {
        //     customer_slug: $('#curate-story-layout').data('customer-slug')
        //   },
        //   dataType: 'json'

        // })

      }
      // $('#' + workflowStage + ' a[href="#' + workflowStage + '-contributors"]')
      //   .find('.fa-spinner').hide();
      $(this).css('visibility', 'visible');
    }
  });
}