
function initLinkedIn () {

  if ($('body').hasClass('stories show')) {
    if (app.screenSize === 'lg') {
      $('.linkedin-widget').not('.linkedin-widget-wide').remove();
    } else {
      $('.linkedin-widget-wide').remove();
    }
  }

  if (typeof(IN) !== 'object') {

    $.ajax({
      url: '//platform.linkedin.com/in.js',
      method: 'get',
      dataType: 'script',
      timeout: 6000
    })
    .done(function () {
      // do linkedin stuff
    })
    .fail(function () {
      console.log('in.js timed out');
    });

  } else {
    IN.parse();
  }

  //  give the  widgets a second to load, then disable their tabbing behavior
  window.setTimeout(function () {
    $("#contribution-connections iframe").each(function () {
      $(this).prop('tabIndex', '-1');
    });
  }, 1000);

}