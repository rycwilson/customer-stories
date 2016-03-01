//= require responsive-toolkit/dist/bootstrap-toolkit

/*
  function monitors viewport size change and triggers callbacks
  at pre-defined bootstrap breakpoints

  ref: http://stackoverflow.com/questions/18575582
       https://github.com/maciej-gurban/responsive-bootstrap-toolkit
*/


$(function () {

  $('#pointer-toggle').on('click', function () {
    var $link = $(this).find('a');
    if ($link.text() == 'show pointers')
      $link.text('hide pointers');
    else
      $link.text('show pointers');
  });

  // this will only run on document load; no dynamic checking
  (function($, viewport){

    if( viewport.is('xs') ) {
      $('.container').css('padding', '0');
    }

  })(jQuery, ResponsiveBootstrapToolkit);

});