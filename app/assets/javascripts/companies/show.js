
function companiesShow () {

  crowdsource();
  curate();

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

  $('td .contribution, td .feedback')
    .popover({
      container: 'body',
      template: '<div class="popover" style="max-width:360px" role="tooltip"><div class="arrow"></div><h3 class="popover-title label-secondary"></h3><div class="popover-content"></div></div>'
    });

  $('td.status-dropdown a.disabled').tooltip({
    container: 'body'
  });

  $('#promote-settings-form').validator({
    custom: {
      'image-requirements': function ($fileInput) {
        var $img = $fileInput.closest('.fileinput').find('.fileinput-exists img'),
            minWidth = $fileInput.data('image-requirements').split('x')[0],
            minHeight = $fileInput.data('image-requirements').split('x')[1],
            width = $img[0].naturalWidth,
            height = $img[0].naturalHeight,
            type = minWidth / minHeight === 1 ? 'logo' : 'landscape',
            ratio = width / height;

        // TODO: check file size
        // http://stackoverflow.com/questions/39488774

        if (width < minWidth || height < minHeight) {
          return "Image too small";
        // ratio must be 1.91 +/- 1%
        } else if ( type === 'landscape' && (ratio < 1.8909 || ratio > 1.929) ||
                    type === 'logo' && (ratio < 0.99 || ratio > 1.01) ) {
          return "Bad aspect ratio";
        }
      }
    }
  });

  // validation won't be triggered unless input fields change
  // -> trigger manually so can detect missing logo or image
  $('#promote-settings-form').validator('validate');

  // add a tooltip message to stories that don't have an image
  $('#sponsored-stories-table').find('img[src=""]').each(
    function () {
      if ( $('#adwords-image-select-modal li').length === 0 ) {
        $(this).closest('.fileinput')
          .tooltip({
            container: 'body',
            placement: 'top',
            title: 'To assign an image to this Sponsored Story, upload images under Settings'
          });
      }
    });

  // curator is signed in user
  $('.curator-select').each(function () {
    $(this).val(
      $(this).children('[value="' + app.current_user.id.toString() + '"]').val()
    ).trigger('change', { auto: true });
  });

}

function companiesShowListeners () {

  newStoryModalListeners();
  crowdsourceListeners();
  curateListeners();
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




