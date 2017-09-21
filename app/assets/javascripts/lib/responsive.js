
function getScreenSize () {
  (function($, viewport){
    if (viewport.is('xs')) {
      app.screenSize = 'xs';
    } else if (viewport.is('sm')) {
      app.screenSize = 'sm';
    } else if (viewport.is('md')) {
      app.screenSize = 'md';
    } else if (viewport.is('lg')) {
      app.screenSize = 'lg';
    }
  })(jQuery, ResponsiveBootstrapToolkit);
}