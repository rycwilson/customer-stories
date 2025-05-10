
window.CSP = window.CSP || {

  browser: {  // ref: http://stackoverflow.com/questions/9847580
    isChrome: !!window.chrome && !!window.chrome.webstore,
    isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
    isFirefox: typeof InstallTrigger !== 'undefined'
  },

  init: function () {
    var controller = $('body').attr('class').split(' ')[0],
        action = $('body').attr('class').split(' ')[1];

    initS3Upload();

    // page-specific stuff
    // (this is a shorthand switch statement)
    (({
      'companies': function () {
        (({
          'new': companiesNew,
          'show': companiesShow,
          'edit': companiesEdit,
        })[action])();
      },
      'stories': function () {
        (({
          'index': storiesIndex,
          'show': storiesShow,
          'edit': storiesEdit
        })[action])();
      },
      'contributions': function () {},
      'profile': function () {
        (({
          'edit': profileEdit,
        })[action])();
      },
      // no js for these controllers, but must be listed here ...
      'site': function () {},
      // devise controllers
      'confirmations': function () {},
      'omniauth_callbacks': function () {},
      'passwords': function () {},
      'registrations': function () {},
      'sessions': function () {},
      'unlocks': function () {}
    })[controller])();

    if ($('#flash').is(':visible')) { flashTimeout(); }

  }

};





