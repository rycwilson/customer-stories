//= require responsive-toolkit/dist/bootstrap-toolkit

/*
  ref: http://stackoverflow.com/questions/18575582
       https://github.com/maciej-gurban/responsive-bootstrap-toolkit
*/

$(function () {

  $('.accordian-toggle').on('click', function () {
    var $link = $(this).find('a');
    if ($link.text() == 'helpful pointers')
      $link.text('hide pointers');
    else
      $link.text('helpful pointers');
  });

  // this will only run on document load; no dynamic checking
  (function($, viewport){
    if( viewport.is('xs') ) {
      $('.container').css('padding', '0');
      $('.container > .col-xs-12').css('padding', '30px');
    }
  })(jQuery, ResponsiveBootstrapToolkit);

});