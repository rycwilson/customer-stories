
function initClicky () {

  if (CSP.env === 'production' &&
      typeof(clicky) === 'undefined' &&
      !CSP.current_user) {  // don't run clicky for signed-in users

    $.getScript('//static.getclicky.com/js', function () {
      try {
        clicky_custom = clicky_custom || {};
        clicky_custom.outbound_disable = 1;
        clicky.init(100886848);
      } catch (e) {
        // handle exception
      }
    });

  }
}