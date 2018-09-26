
function storiesShow () {

  // story is initially hidden in case video failure prompts removal
  var cbSuccess = function () { $('.story-wrapper').removeClass('hidden'); };
  loadVideoThumbnail(cbSuccess);

  linkedinListener($('.story-wrapper'));
  clickyListeners();
  initMoreStories();

  $(document)
    .on('click', '.edit-story a', function () {
      Cookies.set('csp-story-tab', '#story-content');
    })
    .on('scroll', function () {
      if (CSP.screenSize === 'xs') return false;
      if ($('body').hasClass('stories show') && !CSP.current_user) {
        var scrollBottom = $(document).height() - $(window).height() - $(window).scrollTop();
        if (scrollBottom < $('#sign-in-footer').height()) {
          $('#cs-tabbed-carousel').hide();
        }
        else if (!Cookies.get('cs-tabbed-carousel-removed')) {
          $('#cs-tabbed-carousel').show();
        }
      }
    });
}

function initMoreStories () {
  var moreStoriesDelay = 5000,
      // better to do this in css, but sometimes not possible
      companyCustomization = function () {
        if ($('body').hasClass('centerforcustomerengagement')) {
          $('.cs-header, .cs-drawer-content').hover(
            function () {
              $('.cs-header').css('background-color', '#003464');
              $('.cs-drawer-content').css('border-top-color', '#003464');
            },
            function () {
              $('.cs-header').css('background-color', '#333');
              $('.cs-drawer-content').css('border-top-color', '#333');
            }
          );
        }
      };

  if (Cookies.get('cs-carousel-removed')) return false;
  $('.cs-header [class*="remove"]').on('click', function (e) {
    $('#cs-tabbed-carousel').hide();
    Cookies.set('cs-carousel-removed', '1', { expires: 1, path: '/' });
    return false;
  });
  slideDrawerPlugin($('#cs-tabbed-carousel'));  // define the jquery plugin
  $('#cs-tabbed-carousel').imagesLoaded(function () {
    moreStoriesScrollHandlers();
    setTimeout(function () {
      $('.cs-section')
        .slideDrawer()
        .css({ opacity: 0, visibility: "visible" })
        .animate({ opacity: 1 }, 200)
        .animate({ bottom: 0 }, 'fast');
      companyCustomization();
    }, moreStoriesDelay);
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
      function (e) { $(this).popupWindow(e, 550, 544); })
    .on('click', '.twitter-share',
      function (e) { $(this).popupWindow(e, 500, 260); })
    .on('click', '.facebook-share',
      function (e) { $(this).popupWindow(e, 600, 424); })
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

// this function is a copy the one in cs_overlays
function linkedinListener ($story) {
  var $contributors = $story.find('.story-contributors'),
      $widgets = $contributors.find('.linkedin-widget'),
      firstWidgetLoaded = false,
      firstWidgetIndex = null, currentWidgetIndex = null, relativeWidgetIndex = null,
      numLoadedWidgets = 0,
      widgetTimeoutId, widgetTimeoutDelay = 10000,
      setWidgetTimeout = function (delay, handler) {
        widgetTimeoutId = setTimeout(function () {
          window.removeEventListener('message', handler, false);
          $contributors.remove();
        }, delay);
      },
      // profiles that linkedin can't find will still load, need to detect and remove them
      removeIfNotFound = function ($widget) {
        var $iframe = $widget.find('iframe');
        $iframe.one('load', function () {
          var $iframe = $(this);
          setTimeout(function () {
// console.log('iframe width', $iframe.width());
// console.log('script data-width', $iframe.closest('.linkedin-widget').find('script[type*="MemberProfile"]').data('width'));
            if ($iframe.width() !== $iframe.closest('.linkedin-widget')
                                           .find('script[type*="MemberProfile"]').data('width')) {
              $iframe.closest('.linkedin-widget').remove();
            }
          }, 3000);  // the iframes are not fully rendered until some time after the load event
        });
      },
      postMessageHandler = function (event) {
        // For Chrome, the origin property is in the event.originalEvent object.
        var $widget, origin = event.origin || event.originalEvent.origin;
// console.log(event.data);
        if (event.origin.includes('linkedin') &&
            event.data.includes('-ready') &&
            firstWidgetIndex === null) {
          firstWidgetIndex = parseInt(event.data.match(/\w+_(\d+)-ready/)[1], 10);
// console.log('first', firstWidgetIndex);
        } else if (event.origin.includes('linkedin') && event.data.includes('widgetReady')) {
          if (!firstWidgetLoaded) firstWidgetLoaded = true;
          numLoadedWidgets++;
          currentWidgetIndex = parseInt(event.data.match(/\w+_(\d+)\s/)[1], 10);
          relativeWidgetIndex = currentWidgetIndex - firstWidgetIndex;
          $widget = $widgets.eq(relativeWidgetIndex);

          removeIfNotFound($widget);

// console.log('a widget is ready');
// console.log('it is, ', $widget[0]);
// console.log('current', currentWidgetIndex);
// console.log('relative', relativeWidgetIndex);

          if ((numLoadedWidgets === $widgets.length) && $widgets.length !== 1)  {
            clearTimeout(widgetTimeoutId);
            $contributors.css('visibility', 'visible');
          } else if ($widgets.length === 1) {
            $contributors.remove();
          }
        }
      };
  setWidgetTimeout(widgetTimeoutDelay, postMessageHandler);
  window.addEventListener("message", postMessageHandler, false);
  // $(document).one('click', '.cs-content.content--show .close-button', function () {
  //   window.removeEventListener('message', postMessageHandler, false);
  // });
}

function addCspWidget (contributor, index) {
  var template = _.template($('#csp-linkedin-widget-template').html()),
      widgetWidth = (CSP.screenSize === 'lg') ? 420 : 340;

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






