
function storiesShow () {

  $(document)
    .on('click', '.a', function () {
      $('meta[property="og:image"]').attr('content', 'https://csp-development-assets.s3-us-west-1.amazonaws.com/temp/400x400.png')

    })
    .on('click', '.b', function () {
      $('meta[property="og:image"]').attr('content', 'https://csp-development-assets.s3-us-west-1.amazonaws.com/temp/600x600.png')
    })
    .on('click', '.c', function () {
      $('meta[property="og:image"]').attr('content', 'https://csp-development-assets.s3-us-west-1.amazonaws.com/temp/1200x1200.png')
    })
    .on('click', '.d', function () {
      $('meta[property="og:image"]').attr('content', 'https://csp-development-assets.s3-us-west-1.amazonaws.com/temp/600x314.png')
    })
    .on('click', '.e', function () {
      $('meta[property="og:image"]').attr('content', 'https://csp-development-assets.s3-us-west-1.amazonaws.com/temp/1200x628.png')
    })


  var socialShareRedirectURI = (new URL(location)).searchParams.get('redirect_uri');
  if (socialShareRedirectURI) location.href = socialShareRedirectURI;

  // story is initially hidden in case video failure prompts removal
  loadVideoThumbnail(function () { $('.story-wrapper').removeClass('hidden'); });

  if (!$('body').hasClass('pixlee')) {
    // linkedinListener($('.story-wrapper'));
    LI2Observer();
    initMoreStories();
  }

  setTimeout(function () {
    $('#primary-cta-xs').addClass('open');
  }, 3000);

  $(document)
    .on('click touchend', '#primary-cta-xs.open', function (e) {
      if ($(e.target).is('[class*="remove"]')) {  // target might be the icon
        $(this).remove();
      } else if (!$(e.target).is('a')) {  // any part of the buttion that isn't the <a> or X
        $(this).find('a')[0].click();
      }
    })
    .on('click', '.edit-story a', function () {
      Cookies.set('csp-edit-story-tab', '#story-content');
    })
    .on('scroll', function () {
      if (CSP.screenSize === 'xs') return false;
      if ($('body').hasClass('stories show')) {
        // prevent More Stories from covering curator sign in
        if (!CSP.current_user) {
          var scrollBottom = $(document).height() - $(window).height() - $(window).scrollTop();
          if (scrollBottom < $('#sign-in-footer').height()) {
            $('#cs-tabbed-carousel').hide();
          }
          else if (!Cookies.get('cs-tabbed-carousel-removed')) {
            $('#cs-tabbed-carousel').show();
          }
        }
      }
    })

    // ref: https://codepen.io/patrickkahl/pen/DxmfG
    // ref: http://stackoverflow.com/questions/4068373
    // ref: http://stackoverflow.com/questions/24046807
    .on('click', '.linkedin-share', function (e) {
      CSP.screenSize === 'xs' ? $(this).popupWindow(e) : $(this).popupWindow(e, 550, 540);
    })
    .on('click', '.twitter-share', function (e) {
      CSP.screenSize === 'xs' ? $(this).popupWindow(e) : $(this).popupWindow(e, 500, 446);
    })
    .on('click', '.facebook-share', function (e) {
      CSP.screenSize === 'xs' ? $(this).popupWindow(e) : $(this).popupWindow(e, 600, 424);
    });

  // clickyListeners();

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

  // $(document)
    // .on('click', '.company-logo-clicky', { type: 'logo' }, clickyLog)
    // .on('click', '.cta-link', { type: 'cta-link' }, clickyLog)
    // .on('click', '.cta-form', { type: 'cta-form' }, clickyLog)
    // .on('click', '.linkedin-share, .twitter-share, .facebook-share',
    //     { type: 'social-share', title: $('title').text() }, clickyLog)
    // .on('click', '.linkedin-share', function (e) {
    //   if (CSP.screenSize === 'xs')
    //   $(this).popupWindow(e, 550, 540);
    // })
    // .on('click', '.twitter-share', function (e) {
    //   $(this).popupWindow(e, 500, 446);
    // })
    // .on('click', '.facebook-share', function (e) {
    //   $(this).popupWindow(e, 600, 424);
    // });
    // .on('mouseover', '.linkedin-widget',
    //   function () {
    //     window.focus();
    //     $(window).on('blur',
    //       { type: 'linkedin', href: $(this).data('linkedin-url') }, clickyLog);
    //   })
    // .on('mouseout', '.linkedin-widget',
    //   function () {
    //     $(window).off('blur', clickyLog);
    //   });
}

function LI2Observer () {
  var $contributors = $('.story-contributors'),
      $badges = $contributors.find('.LI-profile-badge'),
      MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
      badgeAdded = function (mutation) {
        return mutation.type === 'attributes' && mutation.attributeName === 'data-uid'
      };
      observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === 'attributes') {
            console.log('attributes, attributeName: ', mutation.attributeName, $(mutation.target).data('uid'));
          } else if (mutation.type === 'childList') {
            // console.log('childList, addedNodes: ', mutation.addedNodes[0], $(mutation.target).data('uid'));
            // this would be the last mutation, but it doesn't always happen
            // if ($(mutation.addedNodes[0]).hasClass('resize-sensor')) {
          } else {
            // console.log('other')
          }
          if (badgeAdded(mutation)) {
            // console.log('badge added', $(mutation.target).data('uid'))

            // this is a reliable indicator that the badge has displayed
            // if at least one displays, show the section, with a brief timeout to allow for other badges and style settings
            new ResizeSensor($(mutation.target), function() {
              // console.log('badge rendered', $(mutation.target).data('uid'))

              // give it a brief delay to allow for multiple contributors being rendered,
              // and for local style changes to take effect
              setTimeout(function () {
                $contributors.css({ visibility: 'visible' })
              }, 200)
            });
          }
        });
      });
  $badges.each(function () {
    observer.observe(this, { attributes: true, childList: true });
  });
}







