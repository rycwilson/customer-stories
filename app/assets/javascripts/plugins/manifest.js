

// mvp ready
//= require slimscroll/jquery.slimscroll
//= require magnific-popup/dist/jquery.magnific-popup
//= require datatables/media/js/jquery.dataTables
//= require datatables-plugins/integration/bootstrap/3/dataTables.bootstrap

//= require bootstrap-jasny/js/fileinput.js
//= require mvpready-core
//= require mvpready-helpers
//= require mvpready-admin
//= require mvpready-landing

//= require select2/dist/js/select2
//= require summernote
//= require masonry/dist/masonry.pkgd
//= require imagesloaded/imagesloaded

// s3 upload
//= require jquery-ui/ui/widget
//= require jquery-file-upload/js/jquery.fileupload

//= require bootstrap-switch/dist/js/bootstrap-switch
//= require best_in_place
// for best-in-place validation errors ...
//= require best_in_place.purr
//= require jquery.purr

//= require jquery.inputmask/dist/inputmask/inputmask
//= require jquery.inputmask/dist/inputmask/inputmask.phone.extensions
//= require jquery.inputmask/dist/inputmask/jquery.inputmask

//= require jquery.minicolors
//= require dirtyFields/jquery.dirtyFields
//= require flot/jquery.flot

//= require responsive-toolkit/dist/bootstrap-toolkit
// ref: http://stackoverflow.com/questions/18575582
// https://github.com/maciej-gurban/responsive-bootstrap-toolkit

//= require js-cookie/src/js.cookie

//= require local_time

//= require moment/moment
//= require bootstrap-daterangepicker/daterangepicker

//= require jstz
//= require browser_timezone_rails/set_time_zone


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


