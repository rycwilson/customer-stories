
//= require ./manifest
//= require ./select2
//= require ./linkedin
//= require ./summernote
//= require ./tooltips
//= require ./clicky
//= require ./datatables/csp_datatables
//= require ./daterangepicker
//= require ./google_charts

function constructPlugins () {
  // console.log('constructPlugins()')

  initSelect2();

  // these funtions all copied over from config.js (plugin configuration)
  // (make sure initSelect2() is called first - it defines $.fn.select2Sortable)
  var customStoriesToJson = function () {
        var storyIds = $('[name="plugin[stories][]"]').val() ?
                         $('[name="plugin[stories][]"]').val().map(function (id) { return +id; }) :
                         [];
        return JSON.stringify(storyIds);
      },
      updateScriptTag = function () {
        var isFirstSelection = !$('.script-tag textarea').text().match(/data-stories/);
        $('.script-tag textarea').text(
          $('.script-tag textarea').text()
            .replace(
              isFirstSelection ? /><\/script>/ : /\xa0data-stories="\[((\d+(,)?)+)?\]"/,
              '\xa0data-stories="' + customStoriesToJson() + '"' + (isFirstSelection ? '></script>' : '')
            )
        );
      },
      initSelect2Sortable = function () {
        if (typeof $.fn.select2Sortable !== 'function') {
          setTimeout(initSelect2Sortable, 25);
        } else {
          $('[name="plugin[stories][]"]').select2Sortable(updateScriptTag);
          $('[name="plugin[stories][]"]').show();
        }
      };

  initSelect2Sortable();
  initLinkedIn();
  initDateRangePicker();
  initGoogleCharts(false, null);  // false => just load library; don't draw any charts
  initDataTables();
  initSummernote();
  initTooltips();
  initClicky();

  // $("input[type='tel']").inputmask("999-999-9999");
  $('.mini-colors').not('#edit-plugins .minicolors').minicolors({ theme: 'bootstrap' });
  $('#edit-plugins .mini-colors').minicolors({ theme: 'bootstrap', inline: false });

  // pixlee fixed cta
  // (note order matters in the hasClass arguments)
  if ($('body').hasClass('stories show pixlee') && CSP.screenSize !== 'xs') {
    var pixleeCtaTop,
        pixleeImg = new Image();

    pixleeImg.onload = function () {
      $('.pixlee-cta .cta__image').css('background', 'url("http://assets.pixlee.com/website/webinar/webinar-hero.png") center / cover no-repeat');
      pixleeCtaTop = $('.pixlee-cta').offset().top;
    };
    pixleeImg.src = 'http://assets.pixlee.com/website/webinar/webinar-hero.png';

    $(document).on('scroll', function () {
      var currentScroll = $(window).scrollTop();
      if (currentScroll > pixleeCtaTop - 95) {
        $('.pixlee-cta').css({
          position: 'fixed',
          height: '400px',
          width: $('.story-sidebar').width().toString() + 'px',
          top: '95px',
          left: ($('.story-sidebar').offset().left + parseInt($('.story-sidebar').css('padding-left'), 10)).toString() + 'px'
        });
      } else {
        $('.pixlee-cta').css({
          position: 'static'
        });
      }
    });

  }

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

  $('.datatable').DataTable().destroy();

  // does not seem to be neceessary (and doesn't work anyway):
  // $('.datatable').each(function (table) { table.DataTable.destroy(); });

  $("[data-provider='summernote']").summernote('destroy');

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




