
// ref https://tympanus.net/codrops/2013/03/19/thumbnail-grid-with-expanding-preview/

function initGridPreviews (config, callback) {
  // set the global variables
  $grid = $('#stories-gallery');
  // the items
  $items = $grid.children('li');
  // current expanded item´s index
  current = -1;
  // position (top) of the expanded item
  // used to know if the preview will expand in a different row
  previewPos = -1;
  // extra amount of pixels to scroll the window
  scrollExtra = 100;
  // extra margin when expanded (between the preview element and the next item row)
  marginExpanded = 10;
  $window = $( window );
  $body = $( 'html, body' );
  // transitionend events
  transEndEventNames = {
    'WebkitTransition' : 'webkitTransitionEnd',
    'MozTransition' : 'transitionend',
    'OTransition' : 'oTransitionEnd',
    'msTransition' : 'MSTransitionEnd',
    'transition' : 'transitionend'
  };
  transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ];
  // support for csstransitions
  support = Modernizr.csstransitions;
  // default settings
  settings = {
    minHeight : 500,
    speed : 350,
    easing : 'ease'
  };

  // the settings..
  settings = $.extend( true, {}, settings, config );

  // preload all images
  $grid.imagesLoaded( function() {
    // save item´s size and offset
    saveItemInfo( true );
    // get window´s size
    getWinSize();
    // initialize some events
    initEvents(callback);
  } );

}

function saveItemInfo( saveheight ) {
  $items.each( function() {
    var $item = $( this );
    $item.data( 'offsetTop', $item.offset().top );
    if( saveheight ) {
      $item.data( 'height', $item.height() );
    }
  } );
}

function getWinSize() {
  winsize = { width : $window.width(), height : $window.height() };
}

function initEvents(callback) {
  // when clicking an item, show the preview with the item´s info and large image;
  // close the item if already expanded.
  // also close if clicking on the item´s cross
  $items.on( 'click', 'span.og-close', function() {
    hidePreview();
    return false;
  } ).on( 'click', function(e) {
    var $item = $( this );
    // check if item already opened
    current === $item.index() ? hidePreview() : showPreview( $item );
    return false;
  } );

  // on window resize get the window´s size again
  // reset some values..
  $window.on( 'debouncedresize', function() {

    scrollExtra = 0;
    previewPos = -1;
    // save item´s offset
    saveItemInfo();
    getWinSize();
    var preview = $.data( this, 'preview' );
    if( typeof preview != 'undefined' ) {
      hidePreview();
    }

  } );

  // callback only defined on initial page load
  if (callback) { callback(); }

}

function showPreview( $item ) {
  var preview = $.data( this, 'preview' ),
      // item´s offset top
      position = $item.data( 'offsetTop' );

  scrollExtra = 0;

  // if a preview exists and previewPos is different (different row) from item´s top, then close it
  if( typeof preview != 'undefined' ) {

    // not in the same row
    if( previewPos !== position ) {
      // if position > previewPos then we need to take the current preview´s height in consideration when scrolling the window
      if( position > previewPos ) {
        scrollExtra = preview.height;
      }
      hidePreview();
    }
    // same row
    else {
      preview.update( $item );
      return false;
    }


  }

  // update previewPos
  previewPos = position;
  // initialize new preview for the clicked item
  preview = $.data( this, 'preview', new Preview( $item ) );
  // expand preview overlay
  preview.open();
}

function hidePreview() {
  current = -1;
  var preview = $.data( this, 'preview' );
  preview.close();
  $.removeData( this, 'preview' );
}

// the preview obj / overlay
function Preview( $item ) {
  this.$item = $item;
  this.expandedIdx = this.$item.index();
  this.create();
  this.update();
}

Preview.prototype.create = function() {
  // create Preview structure:
  this.$loading = $( '<div class="og-loading"></div>' );
  this.$logoContainer = $( '<div class="og-logo hidden-xs"></div>').append( this.$loading );
  this.$quote = $( '<blockquote class="og-quote"><p></p></blockquote>' );
  this.$quoteAttr = $( '<div class="og-quote-attr"></div>');
  this.$contributorProfile = $( '<div class="og-contributor-profile text-center"></div>' );
  this.$testimonial = $( '<div class="og-testimonial"></div>' ).append( this.$quote, this.$quoteAttr, this.$contributorProfile );
  this.$summary = $( '<p></p>' );
  this.$summaryContainer = $( '<div class="og-summary"></div>' ).append( this.$summary );
  this.$closePreview = $( '<span class="og-close"></span>' );
  this.$previewInner = $( '<div class="og-expander-inner"></div>' ).append( this.$closePreview, this.$logoContainer, this.$summaryContainer, this.$testimonial );
  this.$previewEl = $( '<div class="og-expander"></div>' ).append( this.$previewInner );
  // append preview element to the item
  this.$item.append( this.getEl() );
  // set the transitions for the preview and the item
  if( support ) {
    this.setTransition();
  }
};

Preview.prototype.setTransition = function () {
  this.$previewEl.css( 'transition', 'height ' + settings.speed + 'ms ' + settings.easing );
  this.$item.css( 'transition', 'height ' + settings.speed + 'ms ' + settings.easing );
};

Preview.prototype.getEl = function () {
  return this.$previewEl;
};

Preview.prototype.update = function( $item ) {
  // update with new item´s details
  if( $item ) {
    this.$item = $item;
  }

  // if already expanded, remove class "og-expanded" from current item and add it to new item
  if( current !== -1 ) {
    var $currentItem = $items.eq( current );
    this.$item.addClass( 'og-expanded' );
    // position the preview correctly
    this.positionPreview();
  }

  // update current value
  current = this.$item.index();
  // update preview´s content
  var $itemEl = this.$item.children( 'a' ),
      eldata = {
      logosrc : $itemEl.data( 'logosrc' ),
      customer : JSON.parse( $itemEl.data( 'customer' ) ),
      summary : JSON.parse( $itemEl.data( 'summary' ) ),
      quote : JSON.parse( $itemEl.data( 'quote' ) ),
      quoteAttrName: JSON.parse( $itemEl.data( 'quote-attr-name' ) ),
      quoteAttrTitle: JSON.parse( $itemEl.data( 'quote-attr-title' ) ),
      contributor : $itemEl.data( 'preview-contributor' )
    };

  contributorProfileTemplate = _.template($('#csp-linkedin-widget-template').html());

  var self = this,
      widgetWidth = (app.screenSize === 'lg') ? 420 : 320;

  this.$summary.html( eldata.summary );
  this.$quote.find('p').html( eldata.quote );
  if (eldata.quoteAttrName !== "") {
    this.$quoteAttr.html(
        '<div class="text-right"><span>&#8211;&nbsp;' + eldata.quoteAttrName + ',&nbsp;' + eldata.quoteAttrTitle + '</span></div>'
        // '<div class="text-right"><span>' + eldata.customer + '</span></div>'
      );
  }

  // if (eldata.contributor !== null) {
  //   this.$contributorProfile
  //     .html( contributorProfileTemplate({
  //               contributor: eldata.contributor,
  //               widgetWidth: widgetWidth
  //            }) )
  //     .imagesLoaded(function () {
  //        self.$contributorProfile.find('.csp-linkedin-widget').removeClass('hidden');
  //      });
  // }

  // remove the current image in the preview
  if( typeof self.$logoImg != 'undefined' ) {
    self.$logoImg.remove();
  }

  // preload logo image and add it to the preview
  // for smaller screens we don´t display the logo image (the last media query will hide the wrapper of the image)
  if( self.$logoContainer.is( ':visible' ) ) {
    this.$loading.show();
    $( '<img/>' ).load( function() {
      var $img = $( this );
      if( $img.attr( 'src' ) === self.$item.children('a').data( 'logosrc' ) ) {
        self.$loading.hide();
        self.$logoContainer.find( 'img' ).remove();
        self.$logoImg = $img.fadeIn( 350 );
        self.$logoContainer.prepend( self.$logoImg );
      }
    } ).attr( 'src', eldata.logosrc );
  }
};

Preview.prototype.open = function() {
  setTimeout( $.proxy( function() {
    // set the height for the preview and the item
    this.setHeights();
    // scroll to position the preview in the right place
    this.positionPreview();
  }, this ), 25 );
};

Preview.prototype.setHeights = function() {
  var self = this,
    onEndFn = function() {
      if( support ) {
        self.$item.off( transEndEventName );
      }
      self.$item.addClass( 'og-expanded' );
    };

  this.calcHeight();
  this.$previewEl.css( 'height', this.height );
  this.$item.css( 'height', this.itemHeight ).on( transEndEventName, onEndFn );

  if( !support ) {
    onEndFn.call();
  }

};

Preview.prototype.calcHeight = function() {
  var heightPreview = winsize.height - this.$item.data( 'height' ) - marginExpanded,
    itemHeight = winsize.height;

  if( heightPreview < settings.minHeight ) {
    heightPreview = settings.minHeight;
    itemHeight = settings.minHeight + this.$item.data( 'height' ) + marginExpanded;
  }

  this.height = heightPreview;
  this.itemHeight = itemHeight;
};

Preview.prototype.positionPreview = function() {
  // scroll page
  // case 1 : preview height + item height fits in window´s height
  // case 2 : preview height + item height does not fit in window´s height and preview height is smaller than window´s height
  // case 3 : preview height + item height does not fit in window´s height and preview height is bigger than window´s height
  var position = this.$item.data( 'offsetTop' ),
    previewOffsetT = this.$previewEl.offset().top - scrollExtra,
    scrollVal = this.height + this.$item.data( 'height' ) + marginExpanded <= winsize.height ? position : this.height < winsize.height ? previewOffsetT - ( winsize.height - this.height ) : previewOffsetT;

  $body.animate( { scrollTop : scrollVal }, settings.speed );

};

Preview.prototype.close = function() {
  var self = this,
    onEndFn = function() {
      if( support ) {
        $( this ).off( transEndEventName );
      }
      self.$item.removeClass( 'og-expanded' );
      self.$previewEl.remove();
    };

  setTimeout( $.proxy( function() {

    if( typeof this.$largeImg !== 'undefined' ) {
      this.$largeImg.fadeOut( 'fast' );
    }
    this.$previewEl.css( 'height', 0 );

    // the current expanded item (might be different from this.$item)
    var $expandedItem = $items.eq( this.expandedIdx );
    $expandedItem.css( 'height', $expandedItem.data( 'height' ) ).on( transEndEventName, onEndFn );
    if( !support ) {
      onEndFn.call();
    }

  }, this ), 25 );

  return false;

};