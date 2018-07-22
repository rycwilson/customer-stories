
function selectWidgets() {
  if ($(window).width() > 1200) {
    $('.cs-content.content--show .linkedin-widget').not('.linkedin-widget-wide').remove();
    // console.log('removing non-wide widgets')
  } else {
    $('.linkedin-widget-wide').remove();
    // console.log('removing wide widgets' )
  }
}

function initLinkedIn () {
  if (typeof(IN) !== 'object') {
    // console.log('IN not defined')
    $.ajax({
      url: 'https://platform.linkedin.com/in.js',
      method: 'get',
      dataType: 'script',
      timeout: 6000
    })
      .done(function () {
        // console.log('IN loaded')
      })
      .fail(function () {
        // console.log('in.js timed out');
      });
  } else {
    console.log('IN already defined');
    // IN.parse();
  }
}

function widgetsListener () {
  var firstWidgetLoaded = false,
      firstWidgetIndex = null, currentWidgetIndex = null, relativeWidgetIndex = null,
      overlayLoadTimeout = 10000, firstWidgetReadyTimeout = 10000,
      setWidgetTimeout = function (timeout, handler) {
        setTimeout(function () {
          window.removeEventListener('message', handler, false);
        }, timeout);
      },
      profileNotFound = function (index) {
        // timeout to ensure the widget has had a change to load
        setTimeout(function () {
          if ($('.linkedin-widget').eq(index).prop('clientHeight') === 0) {
            return true;
          } else {
            return false;
          }
        }, 0);
      },
      postMessageHandler = function (event) {
        // For Chrome, the origin property is in the event.originalEvent object.
        var $widget, origin = event.origin || event.originalEvent.origin;
        // console.log(event.data);
        if (event.origin.includes('linkedin') &&
            event.data.includes('-ready') &&
            firstWidgetIndex === null) {
          firstWidgetIndex = parseInt(event.data.match(/\w+_(\d+)-ready/)[1], 10);
        } else if (event.origin.includes('linkedin') && event.data.includes('widgetReady')) {
          currentWidgetIndex = parseInt(event.data.match(/\w+_(\d+)\s/)[1], 10);
          relativeWidgetIndex = currentWidgetIndex - firstWidgetIndex;

          /**
           * Linkedin will report that the widget is loaded even when the profile isn't found.
           * Since we are checking for all widgets loaded before showing (see below),
           * mark the widget as loaded, but then check its length to see if it's a case of "Profile not found"
           */
          // contributors[relativeWidgetIndex].widget_loaded = true;
          console.log('relativeWidgetIndex', relativeWidgetIndex);

          if (profileNotFound(relativeWidgetIndex)) {
            $('.linkedin-widget').eq(relativeWidgetIndex).remove();
          }

          if (!firstWidgetLoaded) {
            firstWidgetLoaded = true;
            setWidgetTimeout(firstWidgetReadyTimeout, postMessageHandler);
          }

          if ($('.cs-content.content--show .linkedin-widget').toArray()
                .every(function (widget) { return $(widget).data('cs-loaded'); })) {
            $('.cs-content.content--show .story-contributors').removeClass('hidden');
          }
        }
      };

  setWidgetTimeout(overlayLoadTimeout, postMessageHandler);
  window.addEventListener("message", postMessageHandler, false);

}

