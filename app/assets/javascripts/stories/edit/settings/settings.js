
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
          unpublishingStory = $current.is($storyInput) && $storyInput.bootstrapSwitch('state') === false,
          toggleHiddenAdInputs = function (shouldCreateAds) {
            if (shouldCreateAds) {
              $('#story-settings__ads-inputs')
                .find(':not([name*="[_destroy]"]):not([name*="[ad_id]"])')
                  .prop('disabled', false)
                  .end()
                .find('[name*="[_destroy]"]')
                  .prop('checked', false)
                  .prop('disabled', true)
            } else {  // destroy ads
              $('#story-settings__ads-inputs')
                .find('input')
                  .prop('disabled', true)
                  .end()
                .find('[name*="[id]"], [name*="[ad_id]"]')
                  .prop('disabled', false)
                  .end()
                .find('[name*="[_destroy]"]')
                  .prop('disabled', false)
                  .prop('checked', true)
            }
          };

      if (unpublishingLogo) {
        if ($previewInput.bootstrapSwitch('state') === true) {
          $previewInput.bootstrapSwitch('toggleState');
        }
        if ($storyInput.bootstrapSwitch('state') === true) {
          $storyInput.bootstrapSwitch('toggleState');
          toggleHiddenAdInputs(false)
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
        toggleHiddenAdInputs(true)

      } else if (unpublishingStory) {
        toggleHiddenAdInputs(false)
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

  $('#story-settings-form').parent().removeClass('hidden')
  if (cbShowTab) cbShowTab();

  $('.bs-switch.publish-control').bootstrapSwitch({
    size: 'small',
    onInit: function (e) {
      // TODO: not sure why this was necessary, probably remove it
      // // without the timeout, one switch is briefly on (?)
      // setTimeout(function () {
      //   $('#story-settings-form').parent().removeClass('hidden');
      //   if (cbShowTab) {
      //     $(window).one('shown.bs.tab', function () {
      //       window.scrollTo(0,0);
      //     });
      //     cbShowTab();
      //   }
      // }, 0);
    }
  });

}