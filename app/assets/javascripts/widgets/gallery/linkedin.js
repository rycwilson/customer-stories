
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
    // console.log('IN already defined');
    IN.parse();
  }
}

function widgetsListener ($story) {
  var firstWidgetLoaded = false,
      firstWidgetIndex = null, currentWidgetIndex = null, relativeWidgetIndex = null,
      overlayLoadTimeout = 10000, firstWidgetReadyTimeout = 10000,
      setWidgetTimeout = function (timeout, handler) {
        setTimeout(function () {
          window.removeEventListener('message', handler, false);
        }, timeout);
      },
      removeProfileNotFound = function () {
        var $widget = arguments[0];
        if ($widget.find('iframe').width() !==
            $widget.find('script[type*="MemberProfile"]').data('width')) {
          $widget.remove();
        }
      },
      postMessageHandler = function (event) {
        // For Chrome, the origin property is in the event.originalEvent object.
        var $widget,
            origin = event.origin || event.originalEvent.origin;
        // console.log(event.data);
        if (event.origin.includes('linkedin') &&
            event.data.includes('-ready') &&
            firstWidgetIndex === null) {
          firstWidgetIndex = parseInt(event.data.match(/\w+_(\d+)-ready/)[1], 10);
        } else if (event.origin.includes('linkedin') && event.data.includes('widgetReady')) {
          currentWidgetIndex = parseInt(event.data.match(/\w+_(\d+)\s/)[1], 10);
          relativeWidgetIndex = currentWidgetIndex - firstWidgetIndex;
          $widget = $story.find('.linkedin-widget').eq(relativeWidgetIndex);

          /**
           * Linkedin will report that the widget is loaded even when the profile isn't found.
           * Since we are checking for all widgets loaded before showing (see below),
           * mark the widget as loaded, but then check its height to see if it should be removed
           */
          $widget.addClass('cs-loaded');

          // run this through a timeout to ensure the widget has rendered
          setTimeout(removeProfileNotFound, 1000, $widget);

          // set a timeout from the moment the first widget loads
          if (!firstWidgetLoaded) {
            firstWidgetLoaded = true;
            setWidgetTimeout(firstWidgetReadyTimeout, postMessageHandler);
          }

          if ($story.find('.linkedin-widget').toArray()
                .every(function (widget) { return $(widget).hasClass('cs-loaded'); })) {
            $story.find('.story-contributors').removeClass('hidden');
          }
        }
      };

  setWidgetTimeout(overlayLoadTimeout, postMessageHandler);

  window.addEventListener("message", postMessageHandler, false);
  $(document).one('click', '.cs-content.content--show .close-button', function () {
    window.removeEventListener('message', postMessageHandler, false);
  });

}

