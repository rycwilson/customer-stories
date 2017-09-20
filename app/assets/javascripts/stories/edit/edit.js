
//= require ./settings
//= require ./content/content
//= require ./contributors

function storiesEdit () {

  storiesEditSettings();
  storiesEditContent();
  storiesEditContributors();

}

// this is used for asynchronous loads of stories/edit/_edit
function initStoriesEdit (cbShowTab) {
  initStoriesEditSettings(cbShowTab);
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
      $('a[href="#curate-stories"]').tab('show');
      setTimeout(function() { window.scrollTo(0, 0); }, 1);
      // TODO: why does the tab switch fail if the below code is absent??
      $('.curate.curator-select').val(
        $('.curate.curator-select').children('[value="' + app.current_user.id.toString() + '"]').val()
      ).trigger('change', { auto: true });

    });

    // old stuff
    // storiesEditBIPListeners();
    // storiesEditCTAsListeners();
    // storiesEditTagsListeners();
    // storiesEditNewContributorListeners();
    // storiesEditResultsListeners();
    // storiesEditPromptsListeners();
    // storiesEditContributionsListeners();
    // storiesEditContentEditorListeners();
}

