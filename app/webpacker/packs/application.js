/* eslint no-console:0 */
// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.
//
// To reference this file, add <%%= javascript_pack_tag 'application' %> to the appropriate
// layout file, like app/views/layouts/application.html.erb

// Uncomment to copy all static images under ../images to the output folder and reference
// them with the image_pack_tag helper in views (e.g <%%= image_pack_tag 'rails.png' %>)
// or the `imagePath` JavaScript helper below.
//
// const images = require.context('../images', true)
// const imagePath = (name) => images(name, true)

import 'core-js/stable';
import 'regenerator-runtime/runtime';

window.$ = $; window.jQuery = jQuery;
require('../vendor/jquery_plugins');
import Rails from 'rails-ujs';
import turbolinks from 'vendor/turbolinks'; 

/* jquery-ui must appear before bootstrap, per https://stackoverflow.com/questions/13731400 */
// import 'jquery-ui/ui/widget';
import 'bootstrap-sass';
import ResponsiveBootstrapToolkit from 'responsive-toolkit';
import 'select2';
import 'datatables.net-bs';
import 'datatables.net-editor-bs'; 
import 'datatables.net-rowgroup-bs';

window.APP = window.APP || buildApp();
getBootstrapViewport(ResponsiveBootstrapToolkit);
APP.init();

function buildApp() {
  const app = { 
    browser: {  // ref: http://stackoverflow.com/questions/9847580
      isChrome: !!window.chrome && !!window.chrome.webstore,
      isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
      isFirefox: typeof InstallTrigger !== 'undefined'
    },
    screenSize: undefined,
    init: () => {
      Rails.start();
      turbolinks.init();
    }
  }
  return app;
}

function getBootstrapViewport(viewport) {
  $(document).ready(() => {
    if (viewport.is('xs')) APP.screenSize = 'xs';
    else if (viewport.is('sm')) APP.screenSize = 'sm';
    else if (viewport.is('md')) APP.screenSize = 'md';
    else if (viewport.is('lg')) APP.screenSize = 'lg';
  })
}