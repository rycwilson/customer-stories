
function companiesShow () {

  // if this page was arrived at through history navigation,
  // make sure there aren't any active dropdowns
  $('dropdown.company-settings').removeClass('active');
  $('dropdown.user-profile').removeClass('active');

  $('.adwords-logo.image-requirements, .adwords-image.image-requirements')
    .popover({
      html: true,
      container: 'body',
      template: '<div class="popover" style="max-width:500px" role="tooltip"><div class="arrow"></div><h3 class="popover-title label-secondary"></h3><div class="popover-content"></div></div>',
      content: function () {
        return '<ul>' +
                 '<li><strong>Minimum dimensions</strong>: ' + $(this).data('min') + ' pixels</li>' +
                 '<li><strong>Greater than minimum dimensions</strong>: Within 1% of the ' + $(this).data('ratio') + ' ratio</li>' +
                 '<li><strong>Suggested dimensions</strong>: ' + $(this).data('suggest') + ' pixels</li>' +
                 '<li><strong>Maximum size</strong>: 1MB (1,048,576 bytes)</li>' +
               '</ul>';
      }
    });

  $('td.status-dropdown a.disabled').tooltip({
    container: 'body'
  });

}

function companiesShowListeners () {

  newStoryModalListeners();
  promoteListeners();
  measureCharts();
  measureStories();
  measureVisitors();

  $(document)
    // toggle display Recent activity groups
    .on('show.bs.collapse hidden.bs.collapse', '#activity-groups .hiddenRow',
      function () {
        $(this).parent().prev().find('i').toggle();
      })

    // apply styling when click on a dropdown option, or navigate away
    .on('click', 'a[href*="companies"], a[href*="profile"]',
      function () {
        var $thisDropdown = $(this).closest('li.dropdown'),
            $otherDropdown = $thisDropdown.parent().find('li.dropdown:not(.open)');
        $thisDropdown.addClass('active');
        $otherDropdown.removeClass('active');
      })

    .on('click', 'a[href="#promote-panel"]',
      function () {

        promote();

      });

}

function newStoryModalListeners () {

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




