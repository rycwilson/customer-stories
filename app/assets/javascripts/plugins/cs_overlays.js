
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
        // console.log('initOverlay()')
        $storyOverlay.find('.social-sharing a').each(function () {
          var redirectUrl, replaceRegex, replacement;

          // the query param identifying the story locally (?cs=) won't yet be present
          // if the story is loaded async'ly
          if (location.href.match(/\?cs=/)) {
            redirectUrl = location.href
          } else {
            // grab the story slug from the encoded href (%2F = /)
            var storySlug = $(this).attr('href').slice(
                               $(this).attr('href').lastIndexOf('%2F') + 3,
                               $(this).attr('href').length
                             );
            redirectUrl = location.href + '?cs=' + storySlug;
          }

          // set provider-specific regex to be matched
          if ($(this).is('[href*="facebook"]')) {
            replaceRegex = new RegExp(/sharer.php\?u=.+$/);
          } else if ($(this).is('[href*="twitter"]')) {
            replaceRegex = new RegExp(/share\?url=.+$/)
          } else if ($(this).is('[href*="linkedin"]')) {
            replaceRegex = new RegExp(/shareArticle\?mini=true&url=.+$/)
          }

          if ($(this).is('[href*="mailto"]')) {
            replaceRegex = /&body=.+$/;
            replacement = '&body=' + encodeURIComponent(redirectUrl)
          } else {
            replacement = function (match, index) {
                return match + encodeURIComponent('?redirect_uri=' + redirectUrl)
              }
          }

          // modify the share url to include the encoded redirect_url
          $(this).attr('href', $(this).attr('href').replace(replaceRegex, replacement))
        });

        if ($storyCard.hasClass('has-video')) {
          cspInitVideo($, $storyOverlay);
        }
        linkedinListener($storyOverlay);
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
  defineJqueryPlugins();

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

    .on('click', '.primary-cta-xs.open', function (e) {
      if ($(e.target).is('[class*="remove"]')) {  // the target may be the icon
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
    })

    /**
     *  social sharing buttons
     */
    .on('click', '.share__button--linkedin a', function (e) {
      window.width < 768 ? $(this).popupWindow(e) : $(this).popupWindow(e, 550, 540);
    })
    .on('click', '.share__button--twitter a', function (e) {
      window.width < 768 ? $(this).popupWindow(e) : $(this).popupWindow(e, 500, 448);
    })
    .on('click', '.share__button--facebook a', function (e) {
      window.width < 768 ? $(this).popupWindow(e) : $(this).popupWindow(e, 600, 424);
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
        widgetStore = {},
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
          if (resizedWidgetWidth !== $widget.data('width')) {
            $widget.remove();
            numWidgets--;
          } else {
          }
        },
        postMessageHandler = function (mesg) {
          var origin = mesg.origin || mesg.originalEvent.origin,  // latter for chrome
              isLinkedIn = origin.includes('linkedin'),
              mesgData = JSON.parse(mesg.data),
              widgetId = mesgData['rpc.channel'],
              isReady = isLinkedIn && mesgData.method === 'ready',
              isResize = isLinkedIn && mesgData.method === 'resize',
              publicProfileUrl = isReady && decodeURIComponent(
                  mesgData.params[0].source.match(
                    /\?public_profile_url=(https%3A%2F%2Fwww\.linkedin\.com%2Fin%2F\w+)&format=/
                  )[1]
                ),
              $widget = $widgets.filter(
                  '[data-linkedin-url="' + (publicProfileUrl ? publicProfileUrl : widgetStore[widgetId]) + '"]'
                ),
              resizedWidgetWidth;

          if (isReady) {
            widgetStore[widgetId] = publicProfileUrl;

            // this is a reliable indicator that the widget has rendered
            new ResizeSensor($widget, function() {
              if ((++numWidgetsRendered === numWidgets)) {
                clearTimeout(widgetTimeoutId);
                $contributors.css('visibility', 'visible');
              }
            });
          }
          if (isResize) {
            resizedWidgetWidth = mesgData.params[0].width;
            removeIfNotFound($widget, resizedWidgetWidth);
          }
        };
    window.addEventListener("message", postMessageHandler, false);
    setWidgetTimeout(widgetTimeoutDelay, postMessageHandler);
    $(document).one('click', '.cs-content.content--show .close-button', function () {
      window.removeEventListener('message', postMessageHandler, false);
    });
  }

  function defineJqueryPlugins () {
    $.fn.popupWindow = function (e, width, height) {
      // Prevent default anchor event
      e.preventDefault();
      // Fixes dual-screen position                         Most browsers      Firefox
      var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
      var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

      var windowWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
      var windowHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

      // Set values for window
      width = width || windowWidth;
      height = height || windowHeight;

      var left = ((windowWidth / 2) - (width / 2)) + dualScreenLeft;
      var top = ((windowHeight / 2) - (height / 2)) + dualScreenTop;

      // Set title and open popup with focus on it
      var strTitle = ((typeof this.attr('title') !== 'undefined') ? this.attr('title') : 'Social Share'),
          strParam = 'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left + ',resizable=no',
          objWindow = window.open(this.attr('href'), 'shareWindow', strParam).focus();
    };
  }

}