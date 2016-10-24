
function initClicky () {

  if (app.env !== 'development' && typeof(clicky) === 'undefined') {

    $.getScript('//static.getclicky.com/js', function () {
      try {
        clicky.init(100886848);
      } catch (e) {
        // handle exception
      }
    });

  }
}