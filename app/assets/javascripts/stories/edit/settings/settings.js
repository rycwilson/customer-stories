
function storiesEditSettings () {

  initStoriesEditSettings();

}

function storiesEditSettingsListeners () {

  $(document)

    // ensure only valid logo/story publish states
    .on('switchChange.bootstrapSwitch', 'input', function (e, data) {
      // note the jquery indexing => necessary for bootstrap switch to work properly
      var $publishLogo = $('input[name="story[logo_published]"]').eq(1),
          $publishPreview = $('input[name="story[preview_published]"]').eq(1),
          $publishStory = $('input[name="story[published]"]').eq(1),
          $current = $(this);

      if ($current.is($publishLogo) && $publishLogo.bootstrapSwitch('state') === false) {
        if ($publishPreview.bootstrapSwitch('state') === true) {
          $publishPreview.bootstrapSwitch('toggleState');
        }
        if ($publishStory.bootstrapSwitch('state') === true) {
          $publishStory.bootstrapSwitch('toggleState');
        }
      } else if ($current.is($publishPreview) && $publishPreview.bootstrapSwitch('state') === true) {

        if ( $('#story_summary').val() === '') {
          flashDisplay('There is no Summary for this Story. Create one under Story Content.', 'danger');
          $publishPreview.bootstrapSwitch('toggleState');
        }

        if ($publishLogo.bootstrapSwitch('state') === false) {
          $publishLogo.bootstrapSwitch('toggleState');
        }
        if ($publishStory.bootstrapSwitch('state') === true) {
          $publishStory.bootstrapSwitch('toggleState');
        }
      } else if ($current.is($publishStory) && $publishStory.bootstrapSwitch('state') === true) {
        if ($publishLogo.bootstrapSwitch('state') === false) {
          $publishLogo.bootstrapSwitch('toggleState');
        }
        if ($publishPreview.bootstrapSwitch('state') === true) {
          $publishPreview.bootstrapSwitch('toggleState');
        }
      }
    })

    .on('click', '#approval-pdf', function (e) {

      var missingInfo = $(this).data('missing-curator-info');

      if (missingInfo.length) {
        e.preventDefault();
        var flashMesg = "Can't generate document because the following Curator fields are missing: " + missingInfo.join(', ');
        flashDisplay(flashMesg, 'danger');
      }

    })

    .on('click', '.customer-logo .change-image', function () {

      var $previewImg = $(this).closest('.fileinput').find('.fileinput-preview img');

      if ($previewImg.attr('src')) {
        // click on the preview
        $(this).closest('.fileinput').find('.thumbnail')[1].click();
      } else {
        // click on the placeholder
        $(this).closest('.fileinput').find('.thumbnail')[0].click();
      }

    });
}

// the select2 boxes initialize synchronously, i.e. subsequent code doesn't
// execute until initilization is complete.
// pass the cbShowTab callback to the bs-switch onInit property
function initStoriesEditSettings (cbShowTab) {

  initS3Upload();

  $('.story-settings.story-tags').select2({
    theme: 'bootstrap',
    placeholder: 'Select'
  });

  $('#story-ctas-select').select2({
    theme: 'bootstrap',
    placeholder: 'Select'
  });

  $('.bs-switch').bootstrapSwitch({
    size: 'small',
    onInit: function () {
      // without the timeout, one switch is briefly on (?)
      setTimeout(function () {
        $('#story-settings-form').parent().removeClass('hidden');
        if (cbShowTab) {
          $(window).one('shown.bs.tab', function () {
            window.scrollTo(0,0);
          });
          cbShowTab();
        }
      }, 0);
    }
  });

}