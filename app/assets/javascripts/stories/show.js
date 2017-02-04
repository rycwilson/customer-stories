
function storiesShow () {

  loadVideoThumbnail();
  widgetsMonitor();
  clickyListeners();

  $(document).on('click', '.cta-form',
    function () {
      $('#outbound-form-modal').modal('show');
    });

}

// NOTE: the contributor data must be passed to the callback as shown;
// if passed via argument, with a 'contributor' parameter in the callback
// and callback returning a function, then $(window).off() won't correctly
// turn off the event listener
function clickyListeners () {

  var clickyLog = function (e) {
    if (typeof clicky !== 'undefined') {
      // console.log(e.data.linkedinUrl);
      clicky.log(e.data.href, $('title').text(), 'outbound');
      // for linkedin widget listeners (window won't focus if this is executed synchronously ...)
      window.setTimeout(function () { this.focus(); }, 200);
    }
  };

  $(document)
    .on('click', '.company-logo', { href: $(this).attr('href') + ' logo' }, clickyLog)
    .on('click', '.cta-link', { href: $(this).attr('href') + ' cta' }, clickyLog)
    .on('click', '.cta-form', { href: $(this).data('target') + ' cta' }, clickyLog)
    .on('click', '.linkedin-share, .twitter-share, .facebook-share',
          // without the short-circuiting, there is an error on undefined.split
          { href: $(this).attr('href') && $(this).attr('href').split('http')[0] }, clickyLog)
    .on('mouseover', '.linkedin-widget',
      function () {
        window.focus();
        $(window).on('blur', { href: $(this).data('linkedin-url') + ' linkedin' }, clickyLog);
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
      pageLoadTimeoutDelay = 6000, firstWidgetReadyTimeoutDelay = 2000,
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






