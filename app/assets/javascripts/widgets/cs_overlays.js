
//= require modernizr/widget_modernizr
//= require js/classie
//= require plugins/grid_overlays
//= require css-element-queries/src/ResizeSensor

function cspInitOverlays ($, $container, subdomain, isDemo, env) {

  var loading = function ($storyCard) {
          $storyCard.addClass('cs-loading cs-still-loading');
          $container.find('a').css('pointer-events', 'none');
        },
      applyScrollBoundaries = function () {
          var maxY, startY = 0;
          $container
            .find('.scroll-wrap').on('touchstart', function (event) {
                startY = event.originalEvent.touches[0].pageY;
              })
              .end()
            .find('.scroll-wrap').on('touchmove', function (event) {
              var offsetY;
              maxY = $(this).prop('scrollHeight') - $(this).prop('offsetHeight');
              offsetY = startY - event.originalEvent.touches[0].pageY;
              // prevent scroll if it's going past the boundary
              if ($(this).prop('scrollTop') + offsetY < 0 || $(this).prop('scrollTop') + offsetY > maxY) {
                event.preventDefault();
                $(this).prop('scrollTop', Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + offsetY)));
              }
            });
          };

  applyScrollBoundaries();

  $container
    // avoid double-tap behavior
    .on('click touchend', '.cs-close-xs', function () {
      // there are multiple close buttons in the story header; don't trigger them all
      $('.content__item--show .cs-close').first().trigger('click');
    })

    .on('click', '.linkedin-widget', function () {
      window.open($(this).data('linkedin-url'), '_blank');
    })

    .on('click', '.primary-cta-xs button.remove', function () {
      $('.primary-cta-xs').each(function () { $(this).remove(); });
      // TODO add a cookie
    })

    .on('click', 'a.published, a.preview-published', function (e) {
      e.preventDefault();
      var $story, $storyCard = $(this);
      if ($storyCard.hasClass('cs-loaded')) {
        return false;  // overlays handler
      } else {
        loading($storyCard);
        $.ajax({
          url: $storyCard.attr('href'),
          method: 'GET',
          data: {
            is_plugin: true,
            window_width: window.innerWidth
          },
          dataType: 'jsonp'
        })
          .done(function (data, status, jqxhr) {
            var storyIndex = $container.is('#cs-gallery') ? $storyCard.index() + 1 : $storyCard.parent().index() + 1;
            $story = $container.find('.content__item:nth-of-type(' + storyIndex + ')');
            trackStoryVisitor($storyCard);
            $.when(
              $story.html(data.html),
              $storyCard.removeClass('cs-still-loading').addClass('cs-loaded')
            )
              .then(function () { linkedinListener($story); })
              .then(function () {
                if ($storyCard.hasClass('has-video')) {
                  cspInitVideo($, $story);
                }
                initLinkedIn();

                // the grid_overlays.js listener is vanilla js, won't pick up on $storyCard.trigger('click')
                $storyCard[0].click();

                setTimeout(function () {
                  $story.find('.primary-cta-xs').addClass('open');
                }, 3000);

              });
          })
          .fail(function () {

          });
      }

    });

  function trackStoryVisitor ($storyCard) {
    if (env === 'customerstories.net' && !isDemo) {
      $storyCard.append(
        '<iframe class="cs-iframe" height="0" width="0" style="display:none" ' +
          'src="' + $storyCard.attr('href') + '?track=1"' +
        '></iframe>'
      );
    }
  }

  function initLinkedIn () {
    if (typeof(IN) !== 'object') {
      // console.log('IN not defined')
      $.ajax({
        url: 'https://platform.linkedin.com/in.js',
        method: 'get',
        dataType: 'script',
        timeout: 5000
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
    var $contributors = $story.find('.story-contributors'),
        $widgets = $contributors.find('.linkedin-widget'),
        firstWidgetLoaded = false,
        firstWidgetIndex = null, currentWidgetIndex = null, relativeWidgetIndex = null,
        numWidgets = $widgets.length,
        numWidgetsRendered = 0,
        widgetTimeoutId, widgetTimeoutDelay = 10000,
        setWidgetTimeout = function (delay, handler) {
          widgetTimeoutId = setTimeout(function () {
            window.removeEventListener('message', handler, false);
            $contributors.remove();
          }, delay);
        },
        // profiles that linkedin can't find will still load, need to detect and remove them
        removeIfNotFound = function ($widget, resizedWidgetWidth) {
          if (resizedWidgetWidth !== $widget.find('script[type*="MemberProfile"]').data('width')) {
            $widget.remove();
            numWidgets--;
          }
        },
        postMessageHandler = function (mesg) {
          var origin = mesg.origin || mesg.originalEvent.origin,  // latter for chrome
              firstWidgetStart = origin.includes('linkedin') && mesg.data.includes('-ready') && (firstWidgetIndex === null),
              widgetReady = origin.includes('linkedin') && mesg.data.includes('widgetReady'),
              widgetResize = origin.includes('linkedin') && mesg.data.includes('resize'),
              $widget,
              resizedWidgetWidth;

          firstWidgetIndex = firstWidgetStart && parseInt(mesg.data.match(/\w+_(\d+)-ready/)[1], 10);

          if (widgetReady || widgetResize) {
            currentWidgetIndex = parseInt(mesg.data.match(/\w+_(\d+)\s/)[1], 10);
            relativeWidgetIndex = currentWidgetIndex - firstWidgetIndex;
            $widget = $widgets.eq(relativeWidgetIndex);
// console.log($widget)
          }
          if (widgetReady) {
// console.log('widgetReady', currentWidgetIndex);
            firstWidgetLoaded = true;  // indempotent assignment

            // this is a reliable indicator that the widget has rendered
            new ResizeSensor($widget, function() {
              numWidgetsRendered++;
              // if ((numWidgetsRendered === numWidgets) && (numWidgets !== 1)) {
              if ((numWidgetsRendered === numWidgets)) {
                clearTimeout(widgetTimeoutId);
                $contributors.css('visibility', 'visible');

              // don't render if there's only a single contributor
              // } else if ((numWidgetsRendered === numWidgets) && (numWidgets === 1)) {
                // $contributors.remove();
              }
            });
          }
          if (widgetResize) {
            resizedWidgetWidth = JSON.parse(mesg.data.split(' ')[1]).params[0];
            removeIfNotFound($widget, resizedWidgetWidth);
          }
        };

    window.addEventListener("message", postMessageHandler, false);
    setWidgetTimeout(widgetTimeoutDelay, postMessageHandler);
    $(document).one('click', '.cs-content.content--show .close-button', function () {
      window.removeEventListener('message', postMessageHandler, false);
    });
  }

}