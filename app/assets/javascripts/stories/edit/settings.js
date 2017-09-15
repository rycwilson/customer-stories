
function storiesEditSettings () {

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