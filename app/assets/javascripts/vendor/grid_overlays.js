/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2015, Codrops
 * http://www.codrops.com
 * 
 * TODO try this for transitions:
 * portal {
 *   position: fixed;
 *   width: 100%;
 *   height: 100%;
 *   transform: scale(0.3);
 *   transform-origin: 90% 90%;
 *   transition: transform 300ms ease-out;
 *   box-shadow: 3px 3px 5px black;
 * }
 * portal.expand {
 *   transform: scale(1);
 * }
 */

(function ($) {
  var bodyEl = document.body,
  docElem = window.document.documentElement,
  support = { transitions: Modernizr.csstransitions },
  // transition end event name
  transEndEventNames = { 'WebkitTransition': 'webkitTransitionEnd', 'MozTransition': 'transitionend', 'OTransition': 'oTransitionEnd', 'msTransition': 'MSTransitionEnd', 'transition': 'transitionend' },
  transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
  onEndTransition = function( el, callback ) {
    var onEndCallbackFn = function( ev ) {
      if( support.transitions ) {
        if( ev.target != this ) return;
        this.removeEventListener( transEndEventName, onEndCallbackFn );
      }
      if( callback && typeof callback === 'function' ) { callback.call(this); }
    };
    if( support.transitions ) {
      el.addEventListener( transEndEventName, onEndCallbackFn );
    }
    else {
      onEndCallbackFn();
    }
  },
  gridEl = document.getElementById('cs-gallery') || document.getElementById('cs-carousel'),
  gridItemsContainer = gridEl.querySelector('.cs-grid'),
  contentItemsContainer = gridEl.querySelector('.cs-content'),
  gridItems = gridItemsContainer.querySelectorAll('.grid__item'),
  contentItems = contentItemsContainer.querySelectorAll('.content__item'),
  // csp - removed since each story now has its own close button
  // closeCtrl = contentItemsContainer.querySelectorAll('.cs-close'),
  current = -1,
  lockScroll = false, xscroll, yscroll,
  isAnimating = false,
  // csp...
  bodyScrollY = $('body').css('overflow-y'),
  bodyScrollX = $('body').css('overflow-x'),
  scrollbarWidth = window.innerWidth - document.body.clientWidth,
  gridOffsetLeft = $(gridEl).offset().left,
  gridOffsetRight = ($(window).width() - ($(gridEl).offset().left + $(gridEl).outerWidth())),
  xsBreakpoint = 768,
  itemOffsetLeft, itemOffsetTop;  // will be assigned when an item is clicked
  $('.cs-content').css('margin-left', '-' + gridOffsetLeft + 'px');

  init();

  /**
   * gets the viewport width and height
   * based on http://responsejs.com/labs/dimensions/
   *
   * csp: not sure about original intent of the authors, but this works better when always using inner height
   */
  function getViewport (axis) {
    var client, inner;
    if( axis === 'x' ) {
      // client = docElem['clientWidth'];
      inner = window['innerWidth'];
    }
    else if( axis === 'y' ) {
      // client = docElem['clientHeight'];
      inner = window['innerHeight'];
    }
    //return client < inner ? inner : client;
    return inner;
  }
  function scrollX() { return window.pageXOffset || docElem.scrollLeft; }
  function scrollY() { return window.pageYOffset || docElem.scrollTop; }

  function init() {
    initEvents();
  }

  function initEvents () {
    [].slice.call(gridItems).forEach(function(item, pos) {
      item.addEventListener('click', function(ev) {
        ev.preventDefault();
        // csp (last expression was added)
        if(isAnimating || current === pos || !$(item).parent().hasClass('cs-loaded')) {
          return false;
        }
        isAnimating = true;
        // index of current item
        current = pos;
        // simulate loading time..
        classie.add(item, 'grid__item--loading');
        setTimeout(function() {
          classie.add(item, 'grid__item--animate');
          // reveal/load content after the last element animates out (todo: wait for the last transition to finish)
          setTimeout(function() { loadContent(item); }, 0);
        }, 0);

      });
    });

    // keyboard esc - hide content
    document.addEventListener('keydown', function(ev) {
      if(!isAnimating && current !== -1) {
        var keyCode = ev.keyCode || ev.which;
        if( keyCode === 27 ) {
          ev.preventDefault();
          if ("activeElement" in document)
              document.activeElement.blur();
              document.activeElement.blur();
              document.activeElement.blur();
              document.activeElement.blur();
          hideContent();
        }
      }
    } );
  }

  /**
   * some csp modifications to ensure overlay opens correctly in a container that can be at any y-position on the page
   */
  function loadContent (item) {

    if (location.href.includes('pixlee.com/blog') && $('.container.fullwidth').length) {
      var horizMargin = $('.container.fullwidth').offset().left.toString() + 'px';
      $('.container.fullwidth').css('margin', '0 ' + horizMargin)
    }

    // add expanding element/placeholder
    var dummy = document.createElement('div');
    dummy.className = 'placeholder';

    // set the width/heigth and position
    itemOffsetLeft = $(item).offset().left - gridOffsetLeft;
    // console.log('itemOffsetLeft', itemOffsetLeft)
    if ($(item).hasClass('grid__item--carousel')) {
      itemOffsetTop = ($('.cs-carousel__carousel').offset().top + parseInt($('.row-horizon').css('padding-top'))) - $(gridEl).offset().top;
    } else {
      itemOffsetTop = item.parentNode.offsetTop;
    }

    // dummy.style.WebkitTransform = 'translate3d(' + itemOffsetLeft + 'px, ' + itemOffsetTop + 'px, 0px) scale3d(' + item.offsetWidth/(gridItemsContainer.offsetWidth + gridOffsetLeft + gridOffsetRight + scrollbarWidth) + ',' + item.offsetHeight/getViewport('y') + ',1)',
    dummy.style.transform = 'translate3d(' + itemOffsetLeft + 'px, ' + itemOffsetTop + 'px, 0px) scale3d(' + item.offsetWidth/(gridItemsContainer.offsetWidth + gridOffsetLeft + gridOffsetRight + scrollbarWidth) + ',' + item.offsetHeight/getViewport('y') + ',1)'
// console.log('translate3d(' + itemOffsetLeft + 'px, ' + itemOffsetTop + 'px, 0px) scale3d(' + item.offsetWidth/(gridItemsContainer.offsetWidth + gridOffsetLeft + gridOffsetRight + scrollbarWidth) + ',' + item.offsetHeight/getViewport('y') + ',1)')
    // add transition class
    classie.add(dummy, 'placeholder--trans-in');

    // insert it after all the grid items
    gridItemsContainer.appendChild(dummy);

    // // body overlay
    // classie.add(bodyEl, 'view-single');
    setTimeout(function() {
      // csp
      $('.cs-main').css('z-index', '100000');
      $('body').css('overflow-x', 'hidden');  // prevents horizontal scrollbar from appearing on transform

      // expands the placeholder
      // csp removed...
      // dummy.style.WebkitTransform = 'translate3d(-5px, ' + (scrollY() - 5) + 'px, 0px)';
      // dummy.style.transform = 'translate3d(-5px, ' + (scrollY() - 5) + 'px, 0px)';
      // csp modified...
      // dummy.style.WebkitTransform = 'translate3d(' + (-1 * gridOffsetLeft) + 'px,' + (-1 * ($('.cs-grid').offset().top - scrollY())) + 'px, 0px)';
      dummy.style.transform = 'translate3d(' + (-1 * gridOffsetLeft) + 'px,' + (-1 * ($('.cs-grid').offset().top - scrollY())) + 'px, 0px)';
// console.log('translate3d(' + (-1 * gridOffsetLeft) + 'px,' + (-1 * ($('.cs-grid').offset().top - scrollY())) + 'px, 0px)')
      // disallow scroll
      window.addEventListener('scroll', noscroll);

    }, 25);

    onEndTransition(dummy, function() {

      $('#cs-loading-pre-select').remove();

      // for sync. loaded stories, animation time is reduced to zero on opening
      $('.cs-overlay-container').removeClass('pre-selected')

      // add transition class
      classie.remove(dummy, 'placeholder--trans-in');
      classie.add(dummy, 'placeholder--trans-out');

      // position the content container
      // csp removed...
      // contentItemsContainer.style.top = scrollY() + 'px';
      // csp modified...
      contentItemsContainer.style.top = (scrollY() - $('.cs-grid').offset().top) + 'px';

      // show the main content container
      classie.add(contentItemsContainer, 'content--show');
      // show content item:
      classie.add(contentItems[current], 'content__item--show');

      // show close control - removed since each story now has its own close button
      // classie.add(closeCtrl, 'close-button--show');

      // sets overflow hidden to the body and allows the switch to the content scroll
      classie.addClass(bodyEl, 'noscroll');

      isAnimating = false;

      // close button
      $('.content__item--show .cs-close').one('click', hideContent);

      // reset gallery
      // (for the gallery: some story cards aren't display due to max rows - see gallery.js.erb)
      $(gridEl)
        .find('.story-card a:not([style*="display: none"])')
          .each(function () {
            $(this)
              .parent()
                .removeClass('cs-hover cs-loading cs-still-loading')
                .end()
              .removeAttr('style');  // this gets rid of pointer-events: none
      });

      // csp: the overlay will have its own scroll bar
      $('body').css('overflow-y', 'hidden');
      $('body').css('overflow-x', bodyScrollX);  // return to original setting
      $('.scroll-wrap').css('overflow-y', 'scroll');

      // direct urls
      history.replaceState({}, null, window.location.pathname + '?cs=' + item.href.slice(item.href.lastIndexOf('/') + 1, item.href.length))
    });
  }

  function hideContent() {
    var gridItem = gridItems[current], contentItem = contentItems[current];

    // return setting to whatever it was before overlay was opened;
    // do this immediately instead of after transition so the "shift" isn't seen
    $('.scroll-wrap').css('overflow-y', 'hidden');
    $('body').css('overflow-y', bodyScrollY);
    classie.remove(contentItem, 'content__item--show');
    classie.remove(contentItemsContainer, 'content--show');
    // classie.remove(closeCtrl, 'close-button--show');
    classie.remove(bodyEl, 'view-single');

    setTimeout(function() {
      var dummy = gridItemsContainer.querySelector('.placeholder');
      classie.removeClass(bodyEl, 'noscroll');
      // dummy.style.WebkitTransform = 'translate3d(' + itemOffsetLeft + 'px, ' + itemOffsetTop + 'px, 0px) scale3d(' + gridItem.offsetWidth/(gridItemsContainer.offsetWidth + gridOffsetLeft + gridOffsetRight + scrollbarWidth) + ',' + gridItem.offsetHeight/getViewport('y') + ',1)';
      dummy.style.transform = 'translate3d(' + itemOffsetLeft + 'px, ' + itemOffsetTop + 'px, 0px) scale3d(' + gridItem.offsetWidth/(gridItemsContainer.offsetWidth + gridOffsetLeft + gridOffsetRight + scrollbarWidth) + ',' + gridItem.offsetHeight/getViewport('y') + ',1)';
      // dummy.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      onEndTransition(dummy, function() {
        // reset content scroll..
        contentItem.parentNode.scrollTop = 0;
        gridItemsContainer.removeChild(dummy);
        classie.remove(gridItem, 'grid__item--loading');
        classie.remove(gridItem, 'grid__item--animate');
        lockScroll = false;
        window.removeEventListener('scroll', noscroll);
        // csp
        $('.cs-main').css('z-index', '50');

        // direct urls
        history.replaceState({}, null, window.location.pathname)

        $('.primary-cta-xs').each(function () {
          $(this).removeClass('open');
        })
      });

      // reset current
      current = -1;

      if (location.href.includes('pixlee.com/blog') && $('.container.fullwidth').length) {
        $('.container.fullwidth').css('margin', '0 auto')
      }
    }, 25);
  }

  function noscroll () {
    if(!lockScroll) {
      lockScroll = true;
      xscroll = scrollX();
      yscroll = scrollY();
    }
    window.scrollTo(xscroll, yscroll);
  }

})(jQuery);