
//= require ./settings/settings
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
      $('#curate-filters .curator').val(
        $('#curate-filters .curator').children('[value="' + CSP.current_user.id.toString() + '"]').val()
      ).trigger('change', { auto: true });

    })

    .on('click', '#edit-story .nav a', function () {
      Cookies.set('csp-edit-story-tab', $(this).attr('href'));
    });

    // .on('scroll', function () {
  // var storyHeaderTop = $('#story-header').offset().top;
    //   console.log('scroll')
    //   var currentScroll = $(window).scrollTop();
    //   if (currentScroll > storyHeaderTop - 25) {
    //     $('#story-header').css({
    //       position: 'fixed',
    //       // height: '100px',
    //       width: $('#curate .layout-main').first().width().toString() + 'px',
    //       top: '25px',
    //       left: ($('#curate .layout-main').first().offset().left +
    //              parseInt($('#curate .layout-main').first().css('padding-left'), 10))
    //                 .toString() + 'px'
    //     });
    //   } else {
    //     $('#story-header').css({
    //       position: 'relative',
    //       // width: '100%',
    //       top: 0,
    //       left: 0
    //     });
    //   }
    // })

}

