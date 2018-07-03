
function getScreenSize () {
  (function($, viewport){
    if (viewport.is('xs')) {
      CSP.screenSize = 'xs';
    } else if (viewport.is('sm')) {
      CSP.screenSize = 'sm';
    } else if (viewport.is('md')) {
      CSP.screenSize = 'md';
    } else if (viewport.is('lg')) {
      CSP.screenSize = 'lg';
    }
  })(jQuery, ResponsiveBootstrapToolkit);
}