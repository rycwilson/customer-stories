
function storiesEditSettings () {

  initStoriesEditSettings();

}

function storiesEditSettingsListeners () {

  $(document)

    // ensure only valid logo/story publish states
    .on('switchChange.bootstrapSwitch', '.form-group.publish input', function (e, data) {
      // note the jquery indexing => necessary for bootstrap switch to work properly
      var $current = $(this),
          $logoInput = $('input:checkbox[name="story[logo_published]"]'),
          unpublishingLogo = $current.is($logoInput) && $logoInput.bootstrapSwitch('state') === false,
          $previewInput = $('input:checkbox[name="story[preview_published]"]'),
          publishingPreview = $current.is($previewInput) && $previewInput.bootstrapSwitch('state') === true,
          $storyInput = $('input:checkbox[name="story[published]"]'),
          publishingStory = $current.is($storyInput) && $storyInput.bootstrapSwitch('state') === true,
          unpublishingStory = $current.is($storyInput) && $storyInput.bootstrapSwitch('state') === false;

      if (unpublishingLogo) {
        if ($previewInput.bootstrapSwitch('state') === true) {
          $previewInput.bootstrapSwitch('toggleState');
        }
        if ($storyInput.bootstrapSwitch('state') === true) {
          $storyInput.bootstrapSwitch('toggleState');
        }

      } else if (publishingPreview) {
        if ($('#story_summary').val() === '') {
          flashDisplay('There is no Summary for this Story. Create one under Story Content.', 'danger');
          $previewInput.bootstrapSwitch('toggleState');
        } else {
          if ($logoInput.bootstrapSwitch('state') === false) {
            $logoInput.bootstrapSwitch('toggleState');
          }
          if ($storyInput.bootstrapSwitch('state') === true) {
            $storyInput.bootstrapSwitch('toggleState');
          }
        }

      } else if (publishingStory) {
        if ($logoInput.bootstrapSwitch('state') === false) {
          $logoInput.bootstrapSwitch('toggleState');
        }
        if ($previewInput.bootstrapSwitch('state') === true) {
          $previewInput.bootstrapSwitch('toggleState');
        }
        $('#story-settings__ads-inputs')
          .find(':not([name*="[_destroy]"])').prop('disabled', false);

      } else if (unpublishingStory) {
        $('#story-settings__ads-inputs')
          .find('[name*="[id]"]').prop('disabled', false).end()
          .find('[name*="[_destroy]"]')
            .prop('disabled', false)
            .prop('checked', true)
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

    // moved to #edit-customer-modal
    // .on('click', '.customer-logo .change-image', function () {
    //   var $previewImg = $(this).closest('.fileinput').find('.fileinput-preview img');
    //   if ($previewImg.attr('src')) {
    //     // click on the preview
    //     $(this).closest('.fileinput').find('.thumbnail')[1].click();
    //   } else {
    //     // click on the placeholder
    //     $(this).closest('.fileinput').find('.thumbnail')[0].click();
    //   }
    // });
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