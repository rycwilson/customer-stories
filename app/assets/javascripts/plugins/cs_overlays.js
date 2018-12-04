
//= require modernizr/widget_modernizr
//= require js/classie
//= require vendor/grid_overlays
//= require css-element-queries/src/ResizeSensor

function cspInitOverlays ($, $container, subdomain, isDemo, env) {

  var pixleeCtaTop, getPixleeCtaTop, showPixleeTab,
      doPixleeStuff = function () {
        var overlayAnimationTime = 200;
        showPixleeTab = function (showTheTab) {
          if (showTheTab) {
            setTimeout(function () {
              $('button.olark-launch-button').css({ opacity: '1', 'pointer-events': 'auto' });
            }, overlayAnimationTime)
          } else {
            $('button.olark-launch-button').css({ opacity: '0', 'pointer-events': 'none' });
          }
        };
        getPixleeCtaTop = function ($storyOverlay) {
          return parseInt($storyOverlay.find('.cs-story-wrapper').css('margin-top'), 10) +
                 $storyOverlay.find('.cs-story-header').outerHeight(true) +
                 $storyOverlay.find('.cs-testimonial').outerHeight(true) +
                 ($storyOverlay.find('.story-results.hidden-xs:not(.visible-xs-block .story-results)').length ? $storyOverlay.find('.story-results.hidden-xs:not(.visible-xs-block .story-results)').outerHeight(true) : 0) +
                 ($storyOverlay.find('.story-ctas.hidden-xs:not(.visible-xs-block .story-ctas)').length ? $storyOverlay.find('.story-ctas.hidden-xs:not(.visible-xs-block .story-ctas)').outerHeight(true) : 0) - 25;  // 25 is margin between header and cta
        };
        // listener for fixing CTA (ref https://stackoverflow.com/questions/24270036)
        document.addEventListener('scroll', function (e) {
          if ($(e.target).is('section.content--show .scroll-wrap')) {
            var currentScroll = $(e.target).scrollTop();
            if (currentScroll > pixleeCtaTop) {
              $('.pixlee-cta').css({    // scroll to that element or below it
                position: 'fixed',
                height: '400px',
                width: $('.story-sidebar').width().toString() + 'px',
                top: '25px',  // header height + margin
                left: ($('.story-sidebar').offset().left + parseInt($('.story-sidebar').css('padding-left'), 10)).toString() + 'px'
              });
            } else {
              $('.pixlee-cta').css({
                position: 'static'
              });
            }
          }
        }, true);
      },
      applyScrollBoundaries = function () {
        var maxY, startY = 0;
        $container
          .find('.scroll-wrap').on('touchstart', function (e) {
              startY = e.originalEvent.touches[0].pageY;
            })
            .end()
          .find('.scroll-wrap').on('touchmove', function (e) {
            var offsetY;
            maxY = $(this).prop('scrollHeight') - $(this).prop('offsetHeight');
            offsetY = startY - e.originalEvent.touches[0].pageY;
            // prevent scroll if it's going past the boundary
            if ($(this).prop('scrollTop') + offsetY < 0 || $(this).prop('scrollTop') + offsetY > maxY) {
              e.preventDefault();
              $(this).prop('scrollTop', Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + offsetY)));
            }
          });
      },
      storyLoading = function ($storyCard) {
        $container.find('a.published, a.preview-published').css('pointer-events', 'none');
        // the forceRedraw() isn't necessary as in index.js because default is always prevented
        $storyCard.addClass('cs-loading cs-still-loading');  // .forceRedraw();
      },
      showPrimaryCtaXs = function ($storyOverlay) {
        setTimeout(function () {
          $storyOverlay.find('.primary-cta-xs').addClass('open');
        }, 3000);
      },
      initOverlay = function ($storyCard, $storyOverlay) {
        if ($storyCard.hasClass('has-video')) {
          cspInitVideo($, $storyOverlay);
        }
        initLinkedIn();
        trackStoryVisitor($storyCard);
      },
      initPreselected = function () {
        if ($container.find('a.cs-loaded').length) {
          var $storyCard = $('a.cs-loaded'),
              storyIndex = $container.is('#cs-gallery') ? $storyCard.index() + 1 : $storyCard.parent().index() + 1,
              $storyOverlay = $container.find('.content__item:nth-of-type(' + storyIndex + ')');
          initOverlay($storyCard, $storyOverlay);
        }
      },
      getStory = function ($storyCard, $storyOverlay) {
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
            $.when(
              $storyOverlay.html(data.html),
              $storyCard.removeClass('cs-still-loading').addClass('cs-loaded')
            )
              .then(function () { linkedinListener($storyOverlay); })
              .then(function () {
                initOverlay($storyCard, $storyOverlay);
                $storyCard[0].click();
                showPrimaryCtaXs($storyOverlay);
              })

          })
          .fail(function () {});

      },
      openOrGetStory = function ($storyCard, $storyOverlay) {
        // console.log('openOrGetStory()')
        if ($storyCard.hasClass('cs-loaded')) {
          // grid overlays handler will open overlay
          showPrimaryCtaXs($storyOverlay);
          if (subdomain === 'pixlee') {
            pixleeCtaTop = getPixleeCtaTop($storyOverlay);
            showPixleeTab(false);
          }
        } else {
          storyLoading($storyCard);
          getStory($storyCard, $storyOverlay);
        }
      },
      resetStoryCardListener = function ($storyCard) {
        // undo hover and click listener if clicking anywhere outside the story card
        // the callback function here was executing on initial tap - why? and why isn't this an issue in index.js?
        // => prevent this with a timeout
        setTimeout(function () {
          $('body').one(
            'touchstart',
            function (e) {
              // console.log('body touchstart')
              if ($(e.target).is($storyCard) || $storyCard.has(e.target).length ) {
                // do nothing
              } else {
                $storyCard.removeClass('cs-hover')
              }
            }
          );
        }, 100)
      };

  applyScrollBoundaries();
  initPreselected();
  if (subdomain === 'pixlee') doPixleeStuff();

  // event listeners
  $container
    .on('click', '.cs-close-xs', function (e) {
      // there are multiple close buttons in the story header; don't trigger them all
      $('.content__item--show .cs-close').first().trigger('click');
    })
    .on('click', '.cs-close', function (e) {
      if (subdomain === 'pixlee') showPixleeTab(true);  // show Pixlee's tab on their home page
    })

    .on('click', '.linkedin-widget', function () {
      window.open($(this).data('linkedin-url'), '_blank');
    })

    .on('click touchend', '.primary-cta-xs.open', function (e) {
      if ($(e.target).is('button.remove')) {
        $('.primary-cta-xs').each(function () { $(this).remove(); });
        // TODO add a cookie
      } else if (!$(e.target).is('a')) {
        $(this).find('a')[0].click();
      }
    })

    .on('click touchstart', 'a.published, a.preview-published', function (e) {
      // console.log('click touchstart')
      var $storyCard = $(this),
          storyIndex = $container.is('#cs-gallery') ? $storyCard.index() + 1 : $storyCard.parent().index() + 1,
          $storyOverlay = $container.find('.content__item:nth-of-type(' + storyIndex + ')');

      e.preventDefault();

      if (e.type === 'click') {
        openOrGetStory($storyCard, $storyOverlay);

      } else {  // touchstart
        if ($storyCard.hasClass('cs-hover')) {
          $storyCard[0].click();

        } else {
          $storyCard.addClass('cs-hover');
          $container.find('a.published, a.preview-published').not($storyCard).each(function () {
            $(this).removeClass('cs-hover');
          });

          // stop the subsequent touchend event from triggering the <a> tag
          $storyCard.one('touchend', function (e) {
            e.preventDefault();
          });

          // undo hover style when clicking anywhere outside the story card
          resetStoryCardListener($storyCard);
        }
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

  function linkedinListener ($storyOverlay) {
    var $contributors = $storyOverlay.find('.story-contributors'),
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