//= require responsive-toolkit/dist/bootstrap-toolkit

/*
  function monitors viewport size change and triggers callbacks
  at pre-defined bootstrap breakpoints

  ref: http://stackoverflow.com/questions/18575582
       https://github.com/maciej-gurban/responsive-bootstrap-toolkit
*/
(function($, viewport){

    $(function () {

      var $submit = $('#contribution-submission-form').find("input[type='submit']");

      if( viewport.is('xs') ) {
        if (!$submit.hasClass('btn-block')) {
          $submit.addClass('btn-block');
        }
      }

      // Execute code each time window size changes
      $(window).resize(
        viewport.changed(function () {
          if( viewport.is('xs') ) {
            if (!$submit.hasClass('btn-block')) {
              $submit.addClass('btn-block');
            }
          }
        })
      );
    });

})(jQuery, ResponsiveBootstrapToolkit);