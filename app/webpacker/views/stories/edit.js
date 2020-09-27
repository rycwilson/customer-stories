import settings from './settings';
import content from './content';

export default {
  init() {
    $("[data-toggle='tooltip']").tooltip();
    settings.init();
    content.init();
    $.when(settings.init, content.init).then(() => {
      $('a[href=".edit-story"]')
        .one('shown.bs.tab', () => { window.scrollTo(0, 0); })
        .tab('show')
      Cookies.set('cs-edit-story-tab', '#story-settings');
      $('#story-settings-form').attr('data-init', true);
    });
  },
  addListeners() {
    settings.addListeners();
    content.addListeners();
    $(document)
      .on('click', '#curate a.all-stories', backToStories)
      .on('click', '#edit-story .nav a', () => {
        Cookies.set('csp-edit-story-tab', $(this).attr('href'));
      });
  }
}

function backToStories(e) {
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
}



