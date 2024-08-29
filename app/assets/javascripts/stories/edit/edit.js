//= require ./validator
//= require ./settings/settings
//= require ./content/content
//= require ./contributors

function storiesEdit() {
  initS3Upload();
  initStorySettingsValidator();
  storiesEditContent();
  storiesEditContributors();
}

// this is used for asynchronous loads of stories/edit/_edit
function initStoriesEdit (shownTabHandler) {
  initS3Upload();
  initStorySettingsValidator();
  initStoriesEditContent();
  initContributorsTable('curate');
}

function storiesEditListeners () {
  let imageTimer;
  const imageDidLoad = (img) => {
    if (img.complete) {
      clearInterval(imageTimer);
      // console.log('image did load')
      
      // the data-validate attribute is to prevent premature validation (per bootstrap-validator)
      img.closest('.form-group').querySelector('input[type="file"]').setAttribute('data-validate', 'true');
      $('#story-settings-form').validator('update').validator('validate');
      return true;
    } 
  };

  storiesEditSettingsListeners();
  storiesEditContentListeners();
  storiesEditContributorsListeners();

  $(document)

    .on('click', '.og-image button', (e) => e.currentTarget.blur())

    .on('validate.bs.validator', '#story-settings-form', (e) => {
      // console.log('validate.bs.validator')
    })

    .on('change.bs.fileinput', '.og-tags', (e) => {
      if (e.target.classList.contains('fileinput')) {
        // console.log('change.bs.fileinput')
        const img = e.target.querySelector('img');
        // img.classList.remove('has-error');
        img.style.visibility = 'hidden';  // validate first
        if (!imageDidLoad(img)) imageTimer = setInterval(imageDidLoad, 100, img)
      }
    })

    .on('click', '#curate a.all-stories', function (e) {
      // replacing state ensure turbolinks:false for the first tab state
      window.history.replaceState({ turbolinks: false }, null, window.location.pathname);
      window.history.pushState({ turbolinks: true }, null, '/curate');
      $('a[href=".curate-stories"]').tab('show');
      setTimeout(() => scrollTo(0, 0));

      // TODO: why does the tab switch fail if the below code is absent??
      $('#curate-filters .curator').val(
        $('#curate-filters .curator').children('[value="' + CSP.current_user.id.toString() + '"]').val()
      ).trigger('change', { auto: true });
    })

    .on('click', '#edit-story .nav a', function () {
      Cookies.set('csp-edit-story-tab', $(this).attr('href'));
    });
}