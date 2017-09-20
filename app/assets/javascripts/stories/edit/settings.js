
function storiesEditSettings () {

  initStoriesEditSettings();

}

function storiesEditSettingsListeners () {

  $(document)

    .on('click', '#approval-pdf-btn', function (e) {

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
// bs-switch has an init callback
function initStoriesEditSettings (cbShowTab) {

  initS3Upload();

  $('.story-settings.story-tags').select2({
    theme: 'bootstrap',
    placeholder: 'Select'
  });

  $('#story-ctas-select').select2({
    theme: 'bootstrap',
    placeholder: 'Select',
    tags: true
  });

  $('.bs-switch').bootstrapSwitch({
    size: 'small',
    onInit: function () {
      // without the timeout, one switch is briefly on (?)
      setTimeout(function () {
        $('#story-settings-form').parent().removeClass('hidden');
        cbShowTab();
      }, 0);
    }
  });

}