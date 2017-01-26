
function companiesShowListeners () {
  newStoryModalListeners();
  measureStories();
  measureVisitors();

  // toggle display Recent activity groups
  $(document).on('show.bs.collapse hidden.bs.collapse',
                 '#activity-groups .hiddenRow',
    function () {
      $(this).parent().prev().find('i').toggle();
  });

}

function measureStories () {

  // $(document).on('click', 'a[href="#measure-stories-container"]',
  //   function () {
  //     if (!$.fn.DataTable.isDataTable($('#measure-visitors-table'))) {
  //       loadVisitors();
  //     }
  //   });
}

function measureVisitors () {
  var initTable = function ($table, data) {
        $table.DataTable({
          data: data,
          columns: [
            { title: '' },
            { title: 'Organization' },
            { title: 'Unique Visitors' },
            { title: 'Visits' }
          ],
          order: [[1, 'asc']]
        });
      },
      updateTable = function ($table, data) {
        $table.DataTable().clear();
        $table.DataTable().rows.add(data);
        $table.DataTable().draw();
      },
      getVisitors = function () {
        var $table = $('#measure-visitors-table');
        $.get({
          url: '/analytics/visitors',
          data: {
            story_id: $('#visitors-story-select').val(),
            date_range: $('#visitors-date-range-input').val()
          },
          success: function (data, status, jqxhr) {
            if ($.fn.DataTable.isDataTable($table)) {
              updateTable($table, data.data);
            } else {
              initTable($table, data.data);
            }
          },
          dataType: 'json'
        });
      },
      getCharts = function () {
        $.get({
          url: '/analytics/charts',
          data: {
            story_id: $('#charts-story-select').val(),
            date_range: $('#charts-date-range-input').val()
          },
          success: function (data, status, jqxhr) {
            initGoogleCharts(false, { referrerTypes: data.referrer_types,
                                      uniqueVisitors: data.unique_visitors });
          },
          dataType: 'json'
        });
      };

  $(document)
    .on('submit', '#charts-filter-form, #visitors-filter-form',
      function (e) {
        e.preventDefault();
        if ($(this).attr('id') === 'charts-filter-form') {
          getCharts();
        } else {
          getVisitors();
        }
      })
    .on('click', 'a[href="#measure-visitors-container"]',
      function () {
        if (!$.fn.DataTable.isDataTable($('#measure-visitors-table'))) {
          getVisitors();
        }
      });
}

function newStoryModalListeners() {

  // jquery-ujs functionality gets lost after turbolinks navigation,
  // so handle it manually ... (limited to modals?)
  $(document).on('click', '#new-story-modal input[type="submit"]',
    function (event) {
      event.preventDefault();
      $.rails.handleRemote($('#new-story-modal form'));
    });

  /*
    Detect changes in new story modal required inputs, and enable
    submit button accordingly.
    'change' event is for the select boxes; 'input' for text box
  */
  $(document).on('change input', '#new-story-modal', function () {
    if ($('#story_customer').val() &&
        $('#story_title').val()) {
      $(this).find("[type='submit']").prop('disabled', false);
    }
    else {
      $(this).find("[type='submit']").prop('disabled', true);
    }
  });

  // reset new story modal form
  $(document).on('hidden.bs.modal', '#new-story-modal', function () {
    // form inputs to default values... (in this case just title)
    $(this).find('form')[0].reset();
    // select2 inputs to default values...
    $('.new-story-customer').select2('val', '');  // single select
    $('.new-story-tags').val('').trigger('change');  // multiple select
  });
}

function adjustPromoCSSChecker () {
  if ($('#promote').hasClass('active')) {
    adjustPromoCSS();
  } else {
    $(document).on('shown.bs.tab', "a[href='#promote-panel']", function () {
      adjustPromoCSS();
    });
  }
}

function adjustPromoCSS () {

  var ad2LogoWidth = parseInt($('.ad2-logo').css('width'), 10);

  $('.ad1-text').each(function () {
    if ($(this).data('text-length') >= 85) {
      $(this).css('font-size', '22px');
    }
  });

  $('.ad2-text').each(function () {
    $(this).css('padding-left', ad2LogoWidth + 20);
    if ($(this).data('text-length') >= 85) {
      $(this).css('font-size', '20px');
      $(this).css('top', '10px');
    } else if ($(this).data('text-length') >= 75) {
      $(this).css('font-size', '22px');
      $(this).css('top', '8px');
    }
  });
}




