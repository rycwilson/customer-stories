
function initLinkedIn () {

  if ($('body').hasClass('stories show')) {
    if (app.screenSize === 'lg') {
      $('.linkedin-widget').not('.linkedin-widget-wide').remove();
    } else {
      $('.linkedin-widget-wide').remove();
    }
  }

  if (typeof(IN) !== 'object') {
    $.getScript('//platform.linkedin.com/in.js', function () {
      // do linkedin stuff
    });
  } else {
    console.log('parsing')
    IN.parse();
  }

  //  give the  widgets a second to load, then disable their tabbing behavior
  window.setTimeout(function () {
    $("#contribution-connections iframe").each(function () {
      $(this).prop('tabIndex', '-1');
    });
  }, 1000);

}