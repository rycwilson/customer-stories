
//= require plugins/manifest
// = require plugins/masonry
//= require plugins/select2
//= require plugins/linkedin
//= require plugins/summernote
//= require plugins/tooltips
//= require plugins/clicky
//= require plugins/datatables
//= require plugins/daterangepicker
//= require plugins/google_charts

function constructPlugins () {

  // initMasonry();
  initSelect2();
  initLinkedIn();
  initDateRangePicker();
  initGoogleCharts(false, null);  // false => just load library; don't draw any charts
  initDataTables();
  initSummernote();
  initTooltips();
  initClicky();

  $('.best_in_place').best_in_place();
  $('.bs-switch').bootstrapSwitch({ size: 'small' });
  $("input[type='tel']").inputmask("999-999-9999");
  $('.mini-colors').minicolors({ theme: 'bootstrap' });
  /*
    dirtyFields() plugin will apply .dirtyField class to label on input change
    (allows for color change)
    Ensure "for" attribute is present on label tag
    and matches the id attribute of the corresponding input field.
  */
  $('#story-tags-form').dirtyFields();
  $('#outbound-links-form').dirtyFields();

  $('#activity-feed-btn').popover({
    title: "Last day's activity",
    placement: 'right',
    html: 'true',
    trigger: 'manual',
    template: '<div class="popover activity-feed-popover" role="tooltip">' +
                '<div class="arrow"></div>' +
                '<div style="position:relative">' +
                  '<h3 class="popover-title"></h3>' +
                  '<button style="z-index:1;position:absolute;top:3px;right:8px" type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                '</div>' +
                '<div class="popover-content"></div>' +
              '</div>'
  });

}

function deconstructPlugins () {
  // Set the data attribute with vanilla js.  Data attributes set via jquery
  // do not persist across turbolinks visits (or don't persist for some unknown reason)
  $('select').each(function () {

    if ($(this).hasClass('stories-filter')) {
      $(this)[0].setAttribute('data-pre-select', $(this).find(':selected').val());
    }

    if ($(this).data('select2')) {
      $(this).select2('destroy');
    }

  });

  $('.grid').masonry('destroy');

  $('.datatable').DataTable().destroy();

  // does not seem to be neceessary (and doesn't work anyway):
  // $('.datatable').each(function (table) { table.DataTable.destroy(); });

  $("[data-provider='summernote']").summernote('destroy');

}

function slideDrawerPlugin () {

  var drawer = {

    init: function (options, div) {

      if (options.showDrawer === true && options.slideTimeout === true) {
        setTimeout(function() {
          drawer.slide(div, options.drawerHiddenHeight, options.slideSpeed);
        }, options.slideTimeoutCount);
      } else if (options.showDrawer === 'slide') {
        // Set drawer hidden with slide effect
        drawer.slide(div, options.drawerHiddenHeight, options.slideSpeed);
      } else if (options.showDrawer === false) {
        // Set drawer to hide
        drawer.hide(options, div);
      }

      // there are two headers: visible-xs-block and hidden-xs
      // for auto-show behavior, the click event will be triggered on
      // all headers, including the hidden ones.
      // below ensures only one toggle happens
      $('.cs-header').on('click', function (e) {
        if (app.screenSize === 'xs' && $(this).parent().hasClass('visible-xs-block')) {
          drawer.toggle(options, div);
        } else if (app.screenSize !== 'xs' && $(this).parent().hasClass('hidden-xs')) {
          drawer.toggle(options, div);
        }
      });
    },

    //Toggle function
    toggle: function (options, div) {
      ($(div).height() + options.borderHeight === options.drawerHeight) ?
        drawer.slide( div, options.drawerHiddenHeight, options.slideSpeed ) :
        drawer.slide( div, options.drawerHeight - options.borderHeight, options.slideSpeed );
    },

    // Slide animation function
    slide: function (div, height, speed) {
      $(div).animate({ 'height': height }, speed, 'swing',
        function () {
          $('.cs-header i[class*="fa-chevron"]').toggle();
        });
    },

    hide: function (options, div) {
      $(div).css('height', options.drawerHiddenHeight);
    },
  };

  $.fn.slideDrawer = function (options) {
    var $drawerContent = $('#more-stories-container .cs-drawer-content'),  /* Content height of drawer */
        borderHeight = parseInt($drawerContent.css('border-top-width')); /* Border height of content */

    var drawerHeight = this.height() + borderHeight; /* Total drawer height + border height */
    var drawerContentHeight = $drawerContent.outerHeight(); //- borderHeight; /* Total drawer content height minus border top */
    var drawerHiddenHeight = (drawerHeight - drawerContentHeight) - borderHeight; /* How much to hide the drawer, total height minus content height */
    var defaults = {
      showDrawer: 'slide', /* Drawer hidden on load by default, options (true, false, slide) */
      slideSpeed: 700, /* Slide drawer speed 3 secs by default */
      slideTimeout: true, /* Sets time out if set to true showDrawer false will be ignored */
      slideTimeoutCount: 5000, /* How long to wait before sliding drawer */
      drawerContentHeight: drawerContentHeight, /* Div content height no including tab or border */
      drawerHeight: drawerHeight, /* Full div height */
      drawerHiddenHeight: drawerHiddenHeight, /* Height of div when hidden full height minus content height */
      borderHeight: borderHeight /* border height if set in css you cann overwrite but best just leave alone */
    };
    /* Overwrite defaults */
    var pluginOptions = $.extend(defaults, options);
    return this.each(function () {
      drawer.init(pluginOptions, this);
    });
  };

}

// datetime-moment plugin
// https://datatables.net/plug-ins/sorting/datetime-moment
(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["jquery", "moment", "datatables.net"], factory);
  } else {
    factory(jQuery, moment);
  }
}(function ($, moment) {

  $.fn.dataTable.moment = function ( format, locale ) {
    var types = $.fn.dataTable.ext.type;

    // Add type detection
    types.detect.unshift( function ( d ) {
      if ( d ) {
            // Strip HTML tags and newline characters if possible
            if ( d.replace ) {
              d = d.replace(/(<.*?>)|(\r?\n|\r)/g, '');
            }

            // Strip out surrounding white space
            d = $.trim( d );
          }

        // Null and empty values are acceptable
        if ( d === '' || d === null ) {
          return 'moment-'+format;
        }

        return moment( d, format, locale, true ).isValid() ?
        'moment-'+format :
        null;
      } );

    // Add sorting method - use an integer for the sorting
    types.order[ 'moment-'+format+'-pre' ] = function ( d ) {
      if ( d ) {
            // Strip HTML tags and newline characters if possible
            if ( d.replace ) {
              d = d.replace(/(<.*?>)|(\r?\n|\r)/g, '');
            }

            // Strip out surrounding white space
            d = $.trim( d );
          }

          return d === '' || d === null ?
          -Infinity :
          parseInt( moment( d, format, locale, true ).format( 'x' ), 10 );
        };
      };

    }));

// social sharing
$.fn.socialSharePopup = function (e, width, height) {
  // Prevent default anchor event
  e.preventDefault();
  // Fixes dual-screen position                         Most browsers      Firefox
  var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
  var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

  var windowWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
  var windowHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

  // Set values for window
  width = width || '550';
  height = height || '442';

  var left = ((windowWidth / 2) - (width / 2)) + dualScreenLeft;
  var top = ((windowHeight / 2) - (height / 2)) + dualScreenTop;

  // Set title and open popup with focus on it
  var strTitle = ((typeof this.attr('title') !== 'undefined') ? this.attr('title') : 'Social Share'),
      strParam = 'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left + ',resizable=no',
      objWindow = window.open(this.attr('href'), 'shareWindow', strParam).focus();
};


