function storiesEditSettingsListeners () {

  $(document)

    // ensure only valid logo/story publish states
    .on('switchChange.bootstrapSwitch', '.story-settings__publish input', function (e, data) {
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
          // flashDisplay('There is no Summary for this Story. Create one under Story Content.', 'danger');
          $('.story-header__flash')
            .addClass('alert alert-warning')
            .html(
              '<ul class="fa-ul">' +
                '<li>' +
                  '<strong><i class="fa fa-fw fa-warning"></i></strong>&nbsp;&nbsp;' +
                  '<p>There is no Summary for this Story. Create one under Story Content.</p>' +
                '</li>' +
              '</ul>'
            )
            setTimeout(function () {
              $('.story-header__flash').removeClass('alert alert-warning')
            }, 2500);
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

    .on('focus', '.hidden-link input', function () { $(this).blur(); })
    .on('click', '.hidden-link__refresh', function () {
      $(this).blur();
      // var hiddenLink = [location.origin, chance.guid()].join('/');

      // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
      var hiddenLink = window.location.origin + '/' + Date.now().toString(36) + Math.random().toString(36).substring(2);
      $('.hidden-link input').val(hiddenLink);
      $('.hidden-link__copy')
        .attr('title', 'Save changes to enable Copy')
        .tooltip('fixTitle')
        .addClass('disabled')
    })
    .on('click', '.hidden-link__copy', function (e) {
      $(this).blur();
      if ($(this).is('.disabled')) {
        e.stopPropagation();
        return false;
      }
      var $temp = $('<input />');
      $('body').append($temp);
      $temp.val($('.hidden-link input').val())
           .select();
      document.execCommand('copy');
      $temp.remove();
      $(this)
        .attr('title', 'Copied!')
        .tooltip('fixTitle')
        .tooltip('show')
        .one('hidden.bs.tooltip', function () {
          $('.hidden-link__copy')
            .attr('title', 'Copy')
            .tooltip('fixTitle');
        });
    });
}
