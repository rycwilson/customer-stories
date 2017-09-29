
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