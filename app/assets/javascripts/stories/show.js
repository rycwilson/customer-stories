
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
          // console.log(event);
          if (event.origin === "https://platform.linkedin.com" &&
              event.data.includes('-ready') && firstWidgetIndex === null) {
            console.log(event.data);
            firstWidgetIndex = parseInt(event.data.match(/\w+_(\d+)-ready/)[1], 10);
            console.log('firstWidgetIndex: ', firstWidgetIndex);

          } else if (event.origin === "https://platform.linkedin.com" &&
              event.data.includes('widgetReady')) {
            console.log(event.data);
            currentWidgetIndex = parseInt(event.data.match(/\w+_(\d+)\s/)[1], 10);
            console.log('currentWidgetIndex: ', currentWidgetIndex);
            relativeWidgetIndex = currentWidgetIndex - firstWidgetIndex;
            console.log('relativeWidgetIndex: ', relativeWidgetIndex);
            contributors[relativeWidgetIndex].widget_loaded = true;
            // console.log('widgetReady for: ', contributors[relativeWidgetIndex]);
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
    console.log('removing message listener (from widgetsMonitor)');
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
         var subs = false;
         story.published_contributors
              .forEach(function (contributor, index) {
                 if (!contributor.widget_loaded) {
                   subs = true;
                   // console.log('widget did not load: ', delay, contributor.linkedin_url);
                   contributor.widget_loaded = subWidget(contributor, index);
                 }
               });
         if (subs) {
           $('.linkedin-widgets').imagesLoaded(function () {
             $('.sub-widget-wrapper').removeClass('hidden');
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

function subWidget (contributor, index) {
  var template = _.template($('#sub-linkedin-widget-template').html());

  if (contributor.linkedin_photo_url && contributor.linkedin_title &&
      contributor.linkedin_company) {
    $('.linkedin-widget')
      .eq(index)
      .empty()
      .append(template({ contributor: contributor,
                         wide: (app.screenSize === 'lg') ? true : false }));
    return true;
  } else {
    return false;
  }
}






