
import Turbolinks from 'turbolinks';
import global from '../global';
import view from '../views/index';

const turbolinks = {
  init: () => {
    Turbolinks.start();  // TODO is this really necessary? never had it before
    attachListeners();
  }
};

export default turbolinks;

function attachListeners() {
  $(document)

    // Fires once after the initial page load, and again after every Turbolinks visit. 
    // Access visit timing metrics with the event.data.timing object
    .one('turbolinks:load', global.attachListeners)
    .on('turbolinks:load', (e) => {
      const controllerAction = $('body').attr('class').split(' '),
            controller = controllerAction[0],
            action = controllerAction[1];
      view.init(controller, action);
    })

    // Fires when you click a Turbolinks-enabled link. The clicked element is the event target. 
    // Access the requested location with event.data.url. 
    // Cancel this event to let the click fall through to the browser as normal navigation.
    .on('turbolinks:click', function (e) {
      // console.log('turbolinks:click');
    })

    // Fires before visiting a location, except when navigating by history. 
    // Access the requested location with event.data.url. Cancel this event to prevent navigation.
    .on('turbolinks:before-visit', function (e) {
      // console.log('turbolinks:before-visit');
    })

    // Fires immediately after a visit starts
    .on('turbolinks:visit', function (e) {
      // console.log('turbolinks:visit');
    })

    // Fires before Turbolinks issues a network request to fetch the page. 
    // Access the XMLHttpRequest object with event.data.xhr
    .on('turbolinks:request-start', function (e) {
      // console.log('turbolinks:request-start');
    })

    // Fires after the network request completes.
    .on('turbolinks:request-end', function (e) {
      // console.log('turbolinks:request-end');
    })

    // Fires before Turbolinks saves the current page to cache.
    // This event appears to work best for doing stuff prior to leaving a page
    // NOTE: this event occurs after the history state has been changed
    .on('turbolinks:before-cache', function (e) {
      // console.log('turbolinks:before-cache');
     // deconstructPlugins();
    })

    // Fires before rendering the page. Access the new <body> element with event.data.newBody
    .on('turbolinks:before-render', function (e) {
      // console.log('turbolinks:before-render');
    })

    // Fires after Turbolinks renders the page. 
    // This event fires twice during an application visit to a cached location: 
    // once after rendering the cached version, and again after rendering the fresh version.
    .on('turbolinks:render', function (e) {
      // console.log('turbolinks:render');
      if (document.documentElement.hasAttribute('data-turbolinks-preview')) {
        // console.log('preview rendered');
        //constructPlugins();
      }
    })

}
