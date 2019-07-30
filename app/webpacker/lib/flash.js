
const flash = {
  display: (mesg, status, callback) => {
    $('#flash').removeClass('hidden')
               .addClass('alert-' + status)
               .append(mesg)
               .hide()
               .append(flash)
               .fadeIn('fast');
    this.timeout();
  },
  timeout: (callback = () => true) => {
    $('#flash').slideUp(400, function () {
      $(this).removeClass('alert-success alert-info alert-warning alert-danger')
             .hide()
             .empty();
      callback();
    })
  }
}

export default flash;


// status should be one of: success, info, warning, danger
// function flashDisplay (mesg, status, callback) {
//   $('#flash').removeClass('hidden')
//              .addClass('alert-' + status)
//              .append(mesg)
//              .hide().append(flash).fadeIn('fast');
//   setTimeout(
//     function () {
//       $('#flash').slideUp(400, function () {
//         if (callback) callback();
//       });
//     },
//     3000
//   );
//   setTimeout(
//     function () {
//       $('#flash').addClass('hidden')
//                  .removeClass('alert-' + status);
//       $('#flash div').empty();

//       // dispay:none setting appears after first click-cycle,
//       // leads to subsequent failures
//       // solution...
//       $('#flash').css('display', '');
//       // remove all text, leave child elements
//       $('#flash').html($('#flash').children());
//     },
//     3500
//   );
// }