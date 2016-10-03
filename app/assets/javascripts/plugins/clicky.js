
function initClicky () {
  if (typeof(clicky) !== 'object') {
    $.getScript('//static.getclicky.com/js', function () {
      try {
        clicky.init(100886848);
      } catch (e) {
        // handle exception
      }
    });
  }
}