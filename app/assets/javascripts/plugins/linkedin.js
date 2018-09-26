
function initLinkedIn () {

  if ($('body').hasClass('stories show')) {
    if (CSP.screenSize === 'xs') {
      $('.hidden-xs .linkedin-widget').remove();

    } else {
      $('.visible-xs-block .linkedin-widget').remove();
    }
    if (CSP.screenSize === 'lg') {
      $('.linkedin-widget').not('.linkedin-widget-wide').remove();
    } else {
      $('.linkedin-widget-wide').remove();
    }
  }

  if (typeof(IN) !== 'object') {
    // console.log('IN not defined')

    $.ajax({
      url: 'https://platform.linkedin.com/in.js',
      method: 'get',
      dataType: 'script',
      timeout: 6000
    })
    .done(function () {
      // console.log('in.js downloaded');
    })
    .fail(function () {
      // console.log('in.js timed out');
    })
    .always(function () {
      // console.log('linkedin always')
    });

  } else {
    IN.parse();
  }


}