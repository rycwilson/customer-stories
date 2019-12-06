

//= require ./settings/settings
//= require ./content/content
//= require ./contributors

function storiesEdit() {
  
  $('.curate-filters__curator')
    .val(CSP.current_user.id)
    .trigger('change', { auto: true });

  storiesEditSettings();
  storiesEditContent();
  storiesEditContributors();
}

// this is used for asynchronous loads of stories/edit/_edit
function initStoriesEdit(shownTabHandler) {
  initStoriesEditSettings(shownTabHandler);
  initStoriesEditContent();
  initContributorsTable('curate');
}

function storiesEditListeners () {

  storiesEditSettingsListeners();
  storiesEditContentListeners();
  storiesEditContributorsListeners();

  $(document)

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

