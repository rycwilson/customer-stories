
function storiesShow () {

  loadVideoThumbnail();
  widgetsMonitor();
  clickyListeners();
  initMoreStories();
}

function initMoreStories () {

  var widgetShowTimer = null, widgetHideTimer = null;

  // cancel the timers if user interacts with widget
  $('.cs-header').one('click', function (e, data) {
    var auto = data && data.isAuto;
    if (!auto) {
      if (widgetShowTimer) { clearTimeout(widgetShowTimer); }
      if (widgetHideTimer) { clearTimeout(widgetHideTimer); }
    }
  });

  slideDrawerPlugin();  // define the jquery plugin
  $('#more-stories').imagesLoaded(function () {
    moreStoriesScrollHandlers();
    // if user is using a mouse, this will hose dimensions
    // (in a somewhat random way)
    // compensate for this ...
    // if ($('.cs-drawer-content').css('height') !== '141px') {
    //   $('.cs-drawer-content').css('height', '141px');
    //   $('.cs-drawer-items').css('height', '141px');
    // }
    if ( app.company.widget.show &&
         !Cookies.get(app.company.subdomain + '-hide-widget') ) {
      widgetShowTimer = setTimeout(function () {
        $('.cs-header').trigger('click', { isAuto: true } );
        if (app.company.widget.hide) {
          widgetHideTimer = setTimeout(function () {
            $('.cs-header').trigger('click', { isAuto: true } );
          }, app.company.widget.hide_delay);
        }
      }, app.company.widget.show_delay);
      // var inOneHour = new Date(new Date().getTime() + 60 * 60 * 1000);
      Cookies.set(app.company.subdomain + '-hide-widget', '1',
                  { expires: app.company.widget.show_freq });
    }
    $('.cs-thumbnail').hover(
      function () { $(this).css('border-color', app.company.widget.tab_color); },
      function () { $(this).css('border-color', 'rgba(0, 0, 0, 0.7)'); }
    );
    $('.cs-drawer')
      .slideDrawer()
      .css({ opacity: 0, visibility: "visible" })
      .animate({ opacity: 1 }, 200);
  });
}


// NOTE: the contributor data must be passed to the callback as shown;
// if passed via argument, with a 'contributor' parameter in the callback
// and callback returning a function, then $(window).off() won't correctly
// turn off the event listener
function clickyListeners () {

  var clickyLog = function (e) {
    if (typeof clicky !== 'undefined') {
      var href = '';
      if (e.data.type === 'cta-form') {
        href = $(this).data('target');
      } else if (e.data.type === 'social-share') {
        href = 'http:' + $(this).attr('href').split('http')[0];
        clicky.log(href, e.data.title, 'outbound');
        return;
      } else if (e.data.type === 'linkedin') {
        href = e.data.href;
        // for linkedin widget listeners
        // (window won't focus if this is executed synchronously ...)
        window.setTimeout(function () { this.focus(); }, 200);
      } else {
        href = $(this).attr('href');
      }
      clicky.log(href, $('title').text(), 'outbound');
    }
  };

  $(document)
    .on('click', '.company-logo-clicky', { type: 'logo' }, clickyLog)
    .on('click', '.cta-link', { type: 'cta-link' }, clickyLog)
    .on('click', '.cta-form', { type: 'cta-form' }, clickyLog)
    .on('click', '.linkedin-share, .twitter-share, .facebook-share',
        { type: 'social-share', title: $('title').text() }, clickyLog)
    .on('click', '.linkedin-share',
      function (e) { $(this).socialSharePopup(e, 550, 544); })
    .on('click', '.twitter-share',
      function (e) { $(this).socialSharePopup(e, 500, 260); })
    .on('click', '.facebook-share',
      function (e) { $(this).socialSharePopup(e, 600, 424); })
    .on('mouseover', '.linkedin-widget',
      function () {
        window.focus();
        $(window).on('blur',
          { type: 'linkedin', href: $(this).data('linkedin-url') }, clickyLog);
      })
    .on('mouseout', '.linkedin-widget',
      function () {
        $(window).off('blur', clickyLog);
      });
}

/*
 *  There are two timers, after each of which the widgets are all checked for
 *  successful load, and replaced with a substitute widget if not
 *
 *  1 - After the first receipt of a 'widgetReady' postMessage from iframe,
 *      a timer with relatively short delay starts. It is expected that once
 *      a widget is ready, the others will follow in short order, thus this
 *      is a relatively short delay
 *
 *  2 - On page load (turbolinks:load), a timer with longer delay is started.
 *      If a 'widgetReady' message is never received, the first timer will never
 *      start and thus the second is necessary. This timer should be long enough
 *      so that it doesn't step on the first timer, else it might attempt to
 *      replace a widget that could still potentially load successfully
 */

function widgetsMonitor () {
  var contributors = app.stories.find(function (story) {
                       return story.csp_story_path === window.location.pathname;
                     }).published_contributors,
      firstWidgetLoaded = false,
      firstWidgetIndex = null, currentWidgetIndex = null, relativeWidgetIndex = null,
      pageLoadTimeoutDelay = 10000, firstWidgetReadyTimeoutDelay = 10000,
      postMessageHandler = function (event) {
        if ($('body').hasClass('stories show')) {
          // For Chrome, the origin property is in the event.originalEvent object.
          var origin = event.origin || event.originalEvent.origin;
          if (event.origin === "https://platform.linkedin.com" &&
              event.data.includes('-ready') && firstWidgetIndex === null) {
            firstWidgetIndex = parseInt(event.data.match(/\w+_(\d+)-ready/)[1], 10);
          } else if (event.origin === "https://platform.linkedin.com" &&
              event.data.includes('widgetReady')) {
            currentWidgetIndex = parseInt(event.data.match(/\w+_(\d+)\s/)[1], 10);
            relativeWidgetIndex = currentWidgetIndex - firstWidgetIndex;
            if (contributors[relativeWidgetIndex] === undefined) {
              // debugger;
            }
            contributors[relativeWidgetIndex].widget_loaded = true;
            if (!firstWidgetLoaded) {
              firstWidgetLoaded = true;
              setWidgetTimeout(firstWidgetReadyTimeoutDelay, postMessageHandler);
            } else {
              contributors[relativeWidgetIndex].widget_loaded = true ;
            }
          }  // widgetReady event
        }
      };

  setWidgetTimeout(pageLoadTimeoutDelay, postMessageHandler);

  window.addEventListener("message", postMessageHandler, false);

  // remove the listener when navigating away from this page
  $(document).one('turbolinks:before-visit', function () {
    window.removeEventListener('message', postMessageHandler, false);
    contributors.forEach(function (contributor) {
      contributor.widget_loaded = false;
    });
  });

}

function setWidgetTimeout (delay, postMessageHandler) {
  setTimeout(function () {
    if ($('body').hasClass('stories show')) {
      // there is potential for timing discrepancy between the above condition and
      // window.location.pathname, so confirm retrieval of a story ...
      var story = app.stories.find(function (story) {
                    return story.csp_story_path === window.location.pathname;
                  });
      if (story && story.published_contributors) {
         var failures = false;
         story.published_contributors
              .forEach(function (contributor, index) {
                 if (!contributor.widget_loaded) {
                   failures = true;
                   // console.log('widget did not load: ', delay, contributor.linkedin_url);
                   contributor.widget_loaded = addCspWidget(contributor, index);
                 }
               });
         if (failures) {
           $('.linkedin-widgets').imagesLoaded(function () {
             $('.csp-linkedin-widget').removeClass('hidden');
           });
         }
      }
      // keep this listener isolated to stories#show
      window.removeEventListener('message', postMessageHandler, false);
    } else {
      window.removeEventListener('message', postMessageHandler, false);
    }
  }, delay);
}

function addCspWidget (contributor, index) {
  var template = _.template($('#csp-linkedin-widget-template').html()),
      widgetWidth = (app.screenSize === 'lg') ? 420 : 340;

  if (contributor.linkedin_photo_url && contributor.linkedin_title &&
      contributor.linkedin_company) {
    $('.linkedin-widget')
      .eq(index)
      .empty()
      .append(template({ contributor: contributor,
                         widgetWidth: widgetWidth }));
    return true;
  } else {
    return false;
  }
}






