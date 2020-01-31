(($) => {

  const imagesLoaded = require('imagesloaded');
  imagesLoaded.makeJQueryPlugin($);

  // presently only used for story cards but could also be used for datatables loading screens
  $.fn.showLoading = function (isLoading) {
    if (isLoading) {
      // the forceRedraw is necessary because the style changes won't take affect while the link is being followed
      this.addClass('loading still-loading').forceRedraw();
      $('.story-card').css('pointer-events', 'none');
    } else {
      $(this).removeClass('loading still-loading')
      $('.story-card').css('pointer-events', 'initial');
    }
  }

  $.fn.forceRedraw = function () {
    return this.hide(0, function () { $(this).show(); });
  };

  // tabbed carousel 
  $.fn.slideDrawer = function (userOptions = {}) {
    const $drawerContent = this.find('.cs-drawer-content');
    const borderHeight = parseInt($drawerContent.css('border-top-width'));
    const drawerHeight = this.height() + borderHeight; /* Total drawer height + border height */
    const drawerContentHeight = $drawerContent.outerHeight(); //- borderHeight; /* Total drawer content height minus border top */
    const drawerHiddenHeight = (drawerHeight - drawerContentHeight) - borderHeight; /* How much to hide the drawer, total height minus content height */
    const defaultOptions = {
            // hidden on load by default, options (true, false, slide)
            showDrawer: 'slide',
            slideSpeed: 400, 
            slideTimeout: false, /* Sets time out if set to true showDrawer false will be ignored */
            slideTimeoutCount: 5000, /* How long to wait before sliding drawer */
            drawerContentHeight: drawerContentHeight, /* Div content height not including tab or border */
            drawerHeight: drawerHeight, /* Full div height */
            drawerHiddenHeight: drawerHiddenHeight, /* Height of div when hidden full height minus content height */
            borderHeight: borderHeight /* border height if set in css you cann overwrite but best just leave alone */
          };
    const options = Object.assign(defaultOptions, userOptions);
    const drawer = {
            init: (container) => {
              if (options.showDrawer === true && options.slideTimeout === true) {
                setTimeout(
                  () => drawer.slide(container, options.drawerHiddenHeight, options.slideSpeed), 
                  options.slideTimeoutCount
                );
              } else if (options.showDrawer === 'slide') {
                // Set drawer hidden with slide effect
                drawer.slide(container, options.drawerHiddenHeight, options.slideSpeed);
              } else if (options.showDrawer === false) {
                // Set drawer to hide
                drawer.hide(container);
              }
              $(container).on(
                'click',
                '.visible-xs-block .cs-header:not([class*="remove"]), .hidden-xs .cs-header:not([class*="remove"])',
                () => drawer.toggle(container)
              );
            },
            toggle: (container) => {
              ($(container).height() + options.borderHeight) === options.drawerHeight ?
                drawer.slide(container, options.drawerHiddenHeight, options.slideSpeed) :
                drawer.slide(container, options.drawerHeight - options.borderHeight, options.slideSpeed);
            },
            slide: (container, height, speed) => {
              $(container).animate(
                { 'height': height }, 
                speed, 
                'swing', 
                () => $(container).find('.cs-header')
                                    .toggleClass('open closed')
                                    .find('i[class*="fa-chevron"]')
                                      .toggle()
              );
            },
            hide: (container) => {
              $(container).css('height', options.drawerHiddenHeight);
            }
          };

    return this.each(() => drawer.init(this));
  };

  // social sharing
  $.fn.popupWindow = function (e, width, height) {
    // Prevent default anchor event
    e.preventDefault();
    // Fixes dual-screen position                         Most browsers      Firefox
    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left,
          dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top,
          windowWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width,
          windowHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    width = width || windowWidth;
    height = height || windowHeight;

    const left = ((windowWidth / 2) - (width / 2)) + dualScreenLeft,
          top = ((windowHeight / 2) - (height / 2)) + dualScreenTop,
          windowParams = 'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left + ',resizable=no',
          w = window.open(this.attr('href'), 'popupWindow', windowParams).focus();

    w.document.title = typeof this.attr('title') !== 'undefined' ? 
                         this.attr('title') : 
                         'Social Share';
  };

})(jQuery);

