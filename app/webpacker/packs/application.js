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

require('../vendor/jquery_plugins');
import Rails from 'rails-ujs'
import turbolinks from 'vendor/turbolinks'; 

/* jquery-ui must appear before bootstrap, per https://stackoverflow.com/questions/13731400 */
import 'jquery-ui/ui/widget';
import 'bootstrap-sass/assets/javascripts/bootstrap';
import ResponsiveBootstrapToolkit from 'responsive-toolkit';
import 'select2';

window.$ = $; window.jQuery = jQuery;
window.APP = window.APP || buildApp();
getBootstrapViewport(ResponsiveBootstrapToolkit);
APP.init();

function buildApp() {
  const app = { 
    current_user: {}, 
    company: {}, 
    stories: {}, 
    env: '', 
    browser: {  // ref: http://stackoverflow.com/questions/9847580
      isChrome: !!window.chrome && !!window.chrome.webstore,
      isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
      isFirefox: typeof InstallTrigger !== 'undefined'
    },
    screenSize: undefined,
    init: () => {
      Rails.start();
      turbolinks.init();
    },
    reload: (callback = () => true) => { 
      $.getJSON('/app', function (data, status, xhr) {
        Object.assign(APP, data);
        callback();
      });
    }
  }
  // $.getJSON('/app', function (data, status, xhr) { 
  //   Object.assign(APP, data)
  //   console.log('APP')
  // });
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