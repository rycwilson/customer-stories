
function initPromotedStoriesTable () {

  var imageIndex = 0, storyTitleIndex = 1, customerIndex = 2, statusIndex = 3, actionsIndex = 4,
      storyTitleRequirements = "Max 90 characters";

  $('#promoted-stories-table').DataTable({

    ajax: {
      url: '/companies/' + app.company.id.toString() + '/stories/promoted',
      dataSrc: ''
    },

    dom: 't',

    order: [[ statusIndex, 'asc' ]],

    columns: [
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
        name: 'long_headline',
        data: 'ads_long_headline'
      },
      {
        name: 'customer',
        data: 'success.customer.name'
      },
      {
        name: 'status',
        data: 'ads_status',
        render: function (data, type, row, meta) {
          if (type === 'display') {
            return _.template( $('#adwords-status-dropdown-template').html() )({
                     promoteEnabled: app.company.promote_tr,
                     adsEnabled: data === 'ENABLED' ? true : false
                   });
          } else {
            return data;
          }
        }
      },
      {
        name: 'actions',
        data: null,
        render: function (data, type, row, meta) {
          return _.template( $('#promoted-story-actions-dropdown-template').html() )({
            // no parameters required at this point
          });
        }
      },
    ],

    columnDefs: [
      {
        targets: [imageIndex, storyTitleIndex, actionsIndex],
        orderable: false
      },
      {
        targets: [statusIndex, storyTitleIndex, actionsIndex],
        searchable: false
      },
      // { width: '31%', targets: storyTitleIndex },
      // { width: '22%', targets: [imageIndex, customerIndex] },
      { width: '10%', targets: statusIndex },
      { width: '8%', targets: actionsIndex }
    ],

    createdRow: function (row, data, index) {
      $(row).attr('data-story-id', data.id);
      $(row).children().eq(0).addClass('promoted-story-image');
      $(row).children().eq(1).addClass('promoted-story-title')
                             .attr('data-title', data.title);
      $(row).children().eq(2).addClass('promoted-story-customer');
      $(row).children().eq(3).addClass('dropdown status-dropdown');
      $(row).children().eq(4).addClass('dropdown actions-dropdown');
    },

    initComplete: function (settings, json) {

      promotedStoriesEditor = newPromotedStoriesEditor();
      promotedStoriesEditor.on('open', function() {
        $('.DTE_Form_Buttons')
          .prepend('<span class="help-block">' + storyTitleRequirements + '</span>');
      });
      $(this).css('visibility', 'visible');

    },

  });
}