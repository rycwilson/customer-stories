
import video from 'lib/video';
import linkedin from 'lib/linkedin';
import carousel from 'views/plugins/tabbed_carousel';

export default {
  init() {
    redirectPluginShares();
    
    // story is initially hidden in case video failure prompts removal
    video.loadThumbnail(() => $('.story-wrapper').removeClass('hidden'));

    // company-specific stuff
    if (!$('body').hasClass('pixlee')) {
      // linkedin.storiesShowLIObserver();
      initMoreStories();
    }

    setTimeout(() => $('#primary-cta-xs').addClass('open'), 3000);
  },
  addListeners() {
    video.addListeners();
    $(document)
      .on('click touchend', '#primary-cta-xs.open', function (e) {
        if ($(e.target).is('[class*="remove"]')) {  // target might be the icon
          $(this).remove();
        } else if (!$(e.target).is('a')) {  // any part of the button that isn't the <a> or X
          $(this).find('a')[0].click();
        }
      })
      .on('click', '.edit-story a', () => Cookies.set('cs-edit-story-tab', '#story-content'))
      .on('scroll', () => {
        if (APP.screenSize === 'xs') return false;
        if ($('body').hasClass('stories show')) {
          // prevent carousel tab from covering curator sign in
          if (!APP.currentUserId) {
            const scrollBottom = $(document).height() - $(window).height() - $(window).scrollTop();
            if (scrollBottom < $('#sign-in-footer').height()) {
              $('#cs-tabbed-carousel').hide();
            }
            else if (!Cookies.get('cs-carousel-removed')) {
              $('#cs-tabbed-carousel').show();
            }
          }
        }
      })

      // ref: https://codepen.io/patrickkahl/pen/DxmfG
      // ref: http://stackoverflow.com/questions/4068373
      // ref: http://stackoverflow.com/questions/24046807
      .on('click', '.linkedin-share', function (e) {
        APP.screenSize === 'xs' ? $(this).popupWindow(e) : $(this).popupWindow(e, 550, 540);
      })
      .on('click', '.twitter-share', function (e) {
        APP.screenSize === 'xs' ? $(this).popupWindow(e) : $(this).popupWindow(e, 500, 446);
      })
      .on('click', '.facebook-share', function (e) {
        APP.screenSize === 'xs' ? $(this).popupWindow(e) : $(this).popupWindow(e, 600, 424);
      });
  }
}

function initMoreStories() {
  const $carousel = $('#cs-tabbed-carousel');
  if ($carousel.length === 0 || Cookies.get('cs-carousel-removed')) {
    return false;
  }
  // better to do this in css, but sometimes not possible
  const companyCustomization = () => {
    if ($('body').hasClass('centerforcustomerengagement')) {
      $('.cs-header, .cs-drawer-content').hover(
        () => {
          $('.cs-header').css('background-color', '#003464');
          $('.cs-drawer-content').css('border-top-color', '#003464');
        },
        () => {
          $('.cs-header').css('background-color', '#333');
          $('.cs-drawer-content').css('border-top-color', '#333');
        }
      );
    }
  };

  // add pagination and scroll listeners (if necessary)
  carousel.init();

  // the opacity animation is necessary for the transition to visible to work
  setTimeout(function () {
    $carousel.imagesLoaded(function () {
      $carousel.find('.cs-section')
               .slideDrawer()
               .css({ opacity: 0, visibility: "visible" })
               .animate({ opacity: 1 }, 200)
               .animate({ bottom: 0 }, 'fast');
    });
    companyCustomization
  }, 5000);
  $carousel.find('.cs-header [class*="remove"]').on('click', (e) => {
    $carousel.hide();
    Cookies.set('cs-carousel-removed', '1', { expires: 1, path: '/' });
  });
}

// When stories are shared via the plugin, redirect to the customer's site
function redirectPluginShares() {
  const redirectURI = (new URL(location)).searchParams.get('redirect_uri');
  if (redirectURI) location.href = redirectURI;
}