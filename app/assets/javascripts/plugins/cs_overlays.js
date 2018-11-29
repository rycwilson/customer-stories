
//= require modernizr/widget_modernizr
//= require js/classie
//= require vendor/grid_overlays
//= require css-element-queries/src/ResizeSensor

function cspInitOverlays ($, $container, subdomain, isDemo, env) {

  var applyScrollBoundaries = function () {
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
          },
      showPixleeTab = function (showTheTab) {
        if (subdomain === 'pixlee' && showTheTab) {
          setTimeout(function () {
            $('button.olark-launch-button').css({ opacity: '1', 'pointer-events': 'auto' });
          }, 200)
        } else if (subdomain === 'pixlee' && !showTheTab) {
          $('button.olark-launch-button').css({ opacity: '0', 'pointer-events': 'none' });
        }
      },
      getPixleeCtaTop = function ($story) {
        return parseInt($story.find('.cs-story-wrapper').css('margin-top'), 10) +
               $story.find('.cs-story-header').outerHeight(true) +
               $story.find('.cs-testimonial').outerHeight(true) +
               ($story.find('.story-results.hidden-xs:not(.visible-xs-block .story-results)').length ? $story.find('.story-results.hidden-xs:not(.visible-xs-block .story-results)').outerHeight(true) : 0) +
               ($story.find('.story-ctas.hidden-xs:not(.visible-xs-block .story-ctas)').length ? $story.find('.story-ctas.hidden-xs:not(.visible-xs-block .story-ctas)').outerHeight(true) : 0) - 25;  // 25 is margin between header and cta
      },
      pixleeCtaTop;

  $.fn.forceRedraw = function() {
    return this.hide(0, function() { $(this).show(); });
  };

  applyScrollBoundaries();

  if (subdomain === 'pixlee') {
    // ref https://stackoverflow.com/questions/24270036
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

  }

  $container
    // avoid double-tap behavior
    .on('click touchend', '.cs-close-xs', function () {
      // there are multiple close buttons in the story header; don't trigger them all
      $('.content__item--show .cs-close').first().trigger('click');
      showPixleeTab(true);  // show Pixlee's tab on their home page
    })
    .on('click', '.cs-close', function () {
      showPixleeTab(true);  // show Pixlee's tab on their home page
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
      console.log('click touchstart')
      var $storyCard = $(this),
          storyIndex = $container.is('#cs-gallery') ? $storyCard.index() + 1 : $storyCard.parent().index() + 1,
          $story = $container.find('.content__item:nth-of-type(' + storyIndex + ')'),
          storyLoading = function () {
            console.log('storyLoading()')
            // the forceRedraw() isn't necessary as in index.js because default is always prevented
            $storyCard.addClass('cs-loading cs-still-loading');  // .forceRedraw();
            $container.find('a.published, a.preview-published').css('pointer-events', 'none');
          },
          showPrimaryCta = function () {
            setTimeout(function () {
              $story.find('.primary-cta-xs').addClass('open');
            }, 3000);
          }
          initOverlay = function () {
            console.log('initOverlay()')
            if (subdomain === 'pixlee') {
              showPixleeTab(false);
              // no fixed cta on mobile
            }
            if ($storyCard.hasClass('has-video')) cspInitVideo($, $story);
            initLinkedIn();
          },
          getStory = function () {
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
                trackStoryVisitor($storyCard);
                $.when(
                  $story.html(data.html),
                  $storyCard.removeClass('cs-still-loading').addClass('cs-loaded')
                )
                  .then(function () { linkedinListener($story); })
                  .then(function () {
                    initOverlay();
                    $storyCard[0].click();
                    showPrimaryCta();
                  })

              })
              .fail(function () {});
          },
          openOrGetStory = function () {
            console.log('openOrGetStory()')
            if ($storyCard.hasClass('cs-loaded')) {
              // grid overlays handler will open overlay
              showPrimaryCta();
            } else {
              storyLoading();
              getStory();
            }
          },
          clickStoryCard = function () { $storyCard[0].click(); };

      e.preventDefault();

      if (e.type === 'click') {
        openOrGetStory();

      } else {  // touchstart
        if ($storyCard.hasClass('cs-hover')) {
          clickStoryCard()
        } else {
          $storyCard.addClass('cs-hover');
          $container.find('a.published, a.preview-published').not($storyCard).each(function () {
            $(this).removeClass('cs-hover');
          });

          // stop the subsequent touchend event from triggering the <a> tag
          $storyCard.one('touchend', function (e) {
            // console.log('touchend')
            e.preventDefault();
          });

          // next tap => load story
          // $storyCard.one('touchstart', clickStoryCard);

          // undo hover and click listener if clicking anywhere outside the story card
          // the callback function here was executing on initial tap - why? and why isn't this an issue in index.js?
          // => prevent this with a timeout
          setTimeout(function () {
            $('body').one(
              'touchstart',
              function (e) {
                // console.log('body touchstart')
                if ($(e.target).is($storyCard) || $storyCard.has(e.target).length ) {
                  // console.log('story card')
                  // do nothing (link will be followed)
                } else {
                  $storyCard.removeClass('cs-hover')
                  // console.log('not story card')
                  // $storyCard.off('touchstart', clickStoryCard);
                }
              }
            );
          }, 100)



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

  function getQueryParam (param, url) {
    var href = url ? url : window.location.href;
    var reg = new RegExp( '[?&]' + param + '=([^&#]*)', 'i' );
    var string = reg.exec(href);
    return string ? string[1] : null;
  }

}