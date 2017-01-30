
function initClicky () {

  if (app.env === 'production' &&
      typeof(clicky) === 'undefined' &&
      !app.current_user) {  // don't run clicky for signed-in users

    $.getScript('//static.getclicky.com/js', function () {
      try {
        clicky.init(100886848);
      } catch (e) {
        // handle exception
      }
    });

  }
}