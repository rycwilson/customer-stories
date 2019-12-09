
//= require ./validator
//= require ./settings/settings
//= require ./content/content
//= require ./contributors

function storiesEdit() {
  
  $('.curate-filters__curator')
    .val(CSP.current_user.id)
    .trigger('change', { auto: true });

  storiesEditSettings();
  initStorySettingsValidator();
  storiesEditContent();
  storiesEditContributors();
}

// this is used for asynchronous loads of stories/edit/_edit
function initStoriesEdit (shownTabHandler) {
  initStoriesEditSettings(shownTabHandler);
  initStorySettingsValidator();
  initStoriesEditContent();
  initContributorsTable('curate');
}

function storiesEditListeners () {

  var checkForNewImage, checkImageLoaded;  // timer ids
  var imageDidLoad = function ($img) {
    if ($img[0].complete) {
      // console.log('image did load')
      $('.og-image-upload').attr('data-ready-to-validate', true)
      clearInterval(checkImageLoaded);
      $('#story-settings-form').validator('validate');
      return true;
    } else {
      // console.log('image did not load')
    }
  };

   // bs validator will attempt to validate the image that existed prior to upload
  // => check for new image before validating
  var imageIsNew = function ($img) {
    if ($img.attr('src') && $img.attr('src').includes('data:')) {
      // console.log('image is new')
      clearInterval(checkForNewImage);
      if (!imageDidLoad($img)) {
        checkImageLoaded = setInterval(imageDidLoad, 100, $img);
      }
      return true;
    } else {
      // console.log('image is not new')
    }
  };

  storiesEditSettingsListeners();
  storiesEditContentListeners();
  storiesEditContributorsListeners();

  $(document)

    .on('click', '.og-image-upload__button', function () {
      $(this).blur();
      var $existingImage = $('.og-image-upload__thumbnail.fileinput-exists img');
      var $newImage = $('.og-image-upload__thumbnail.fileinput-new img');
      $existingImage.attr('src') ? $existingImage.click() : $newImage.click();
      $('.og-image-upload').attr('data-ready-to-validate', '');
    })

    .on('validate.bs.validator', '#story-settings-form', function () {
      // console.log('validate.bs.validator')
    })

    .on('change.bs.fileinput', '.og-image-upload .fileinput', function (e) {
      // console.log('change.bs.fileinput')
      var $previewImage = $('.og-image-upload__thumbnail.fileinput-preview img');

      $('.og-image-upload').removeClass('has-error')
      $previewImage.css('visibility', 'hidden');  // validate first

      if (!imageIsNew($previewImage)) {
        checkForNewImage = setInterval(imageIsNew, 100, $previewImage);
      }
    })

    .on('click', '#curate a.all-stories', function (e) {
      // replacing state ensure turbolinks:false for the first tab state
      window.history.replaceState(
        { turbolinks: false }, null, window.location.pathname
      );
      window.history.pushState(
        { turbolinks: true }, null, '/curate'
      );
      $('a[href=".curate-stories"]').tab('show');
      setTimeout(function() { window.scrollTo(0, 0); }, 1);
      // TODO: why does the tab switch fail if the below code is absent??
      $('#curate-filters .curator').val(
        $('#curate-filters .curator').children('[value="' + CSP.current_user.id.toString() + '"]').val()
      ).trigger('change', { auto: true });

    })

    .on('click', '#edit-story .nav a', function () {
      Cookies.set('csp-edit-story-tab', $(this).attr('href'));
    });

}

