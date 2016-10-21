
function flashTimeout () {
  setTimeout(function () {
    $('#flash').slideUp();
  }, 3000);
  setTimeout(function () {
    $('#flash').addClass('hidden')
               .removeClass('alert-success alert-info alert-warning alert-danger')
               .empty();
  }, 3500);
}

// status should be one of: success, info, warning, danger
function flashDisplay (mesg, status) {
  $('#flash').removeClass('hidden')
             .addClass('alert-' + status)
             .append(mesg)
             .hide().append(flash).fadeIn('fast');

  setTimeout(function () {
    $('#flash').slideUp();
  }, 3000);

  setTimeout(function () {
    $('#flash').addClass('hidden')
               .removeClass('alert-' + status);
    $('#flash div').empty();

    // dispay:none setting appears after first click-cycle,
    // leads to subsequent failures
    // solution...
    $('#flash').css('display', '');
    // remove all text, leave child elements
    $('#flash').html($('#flash').children());
  }, 3500);
}