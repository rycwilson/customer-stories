
/**
 * the flashDisplay() defined here isn't called; see app/assets/javascripts/lib
 */
function flashDisplay (mesg, status) {
// console.log('lib/assets')
  $('#flash').toggleClass('hidden alert-' + status).append(mesg);
  $('#flash').hide().append(flash).fadeIn('fast');

  setTimeout(function () {
    $('#flash').slideUp();
  }, 3000);

  setTimeout(function () {
    $('#flash').toggleClass('hidden alert-' + status);
    // dispay:none setting appears after first click-cycle,
    // leads to subsequent failures
    // solution...
    $('#flash').css('display', '');
    // remove all text, leave child elements
    $('#flash').html($('#flash').children());
  }, 4000);
}