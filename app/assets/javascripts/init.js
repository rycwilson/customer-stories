
window.app = window.app || {

  browser: {  // ref: http://stackoverflow.com/questions/9847580
    isChrome: !!window.chrome && !!window.chrome.webstore,
    isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
    isFirefox: typeof InstallTrigger !== 'undefined'
  },

  init: function () {
    var controller = $('body').attr('class').split(' ')[0],
        action = $('body').attr('class').split(' ')[1];

    configUnderscore();
    initS3Upload();
    // if (app.env === 'production') {
      // initTracking();
    // }

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
        app.betaFeatures();

        (({
          'index': storiesIndex,
          'show': storiesShow,
          'edit': storiesEdit,
        })[action])();
      },
      'contributions': function () {},
      'profile': function () {
        (({
          'edit': profileEdit,
          'linkedin_callback': profileEdit
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

  },

  // betaFeatures: function () {
  //   if (this.company.feature_flag !== 'demo') {
  //     // workflow features block
  //     $('.tooltip-beta-measure').tooltip({ placement: 'right', container: 'body' });
  //     $('.tooltip-beta-promote').tooltip({ placement: 'top' });
  //   }
  // }
};





