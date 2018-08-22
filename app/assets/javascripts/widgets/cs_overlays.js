
//= require modernizr/widget_modernizr
//= require js/classie
//= require plugins/grid_overlays

function cspInitOverlays ($, $container) {

  var loading = function ($storyCard) {
          $storyCard.addClass('cs-loading');
          $container.find('a').css('pointer-events', 'none');
          setTimeout(function () {
            if (!$storyCard.hasClass('cs-loaded')) {
              $storyCard.addClass('cs-still-loading');
            }
          }, 1000);
        };

  $container.on('click', 'a.published, a.preview-published', function (e) {
    e.preventDefault();
    var $story, $storyCard = $(this);
    if ($storyCard.hasClass('cs-loaded')) {
      setTimeout(function () {
        $storyCard.removeClass('cs-loading cs-still-loading');
      }, 300);  // matches overlay animation time
      return false;
    } else {
      loading($storyCard);
      $.ajax({
        url: $storyCard.attr('href'),
        method: 'GET',
        data: {
          is_widget: true,
          window_width: window.innerWidth
        },
        dataType: 'jsonp'
      })
        .done(function (data, status, jqxhr) {
          var storyIndex = $container.is('#cs-gallery') ? $storyCard.index() + 1 : $storyCard.parent().index() + 1;
          $story = $container.find('.content__item:nth-of-type(' + storyIndex + ')');
          $.when(
            $story.html(data.html),
            $storyCard.addClass('cs-loaded')
          )
            .then(function () { linkedinListener($story); })
            .then(function () {
              if ($storyCard.hasClass('has-video')) {
                cspInitVideo($, $story);
              }
              initLinkedIn();

              // when loading, all cards were set to pointer-events: none
              // now undo that...
              $container.find('a').removeAttr('style');

              // avoid double-tap behavior
              $container.on('click touchend', '.close-button-xs', function () {
                $(this).closest('.cs-content').find('.close-button').trigger('click');
              });
              // the grid_overlays.js listener is vanilla js, won't pick up on $storyCard.trigger('click')
              $storyCard[0].click();

            });
        })
        .fail(function () {

        });
    }

  });

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

  function linkedinListener ($story) {
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

}