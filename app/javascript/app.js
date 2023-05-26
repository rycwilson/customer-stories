import {} from './jquery.js';   // creates global $, jQuery
import {} from 'jquery-ujs/src/rails.js';
import {} from 'jquery-ui/dist/jquery-ui.js';
import {} from './bootstrap.js';
import { Turbo } from 'turbo-rails-1.3.2/app/assets/javascripts/turbo.js';
import * as turboCallbacks from './turbo_callbacks.js';
import cookies from 'js-cookie';
window.Cookies = cookies
import companies from './views/companies.js';
import profile from './views/user_profile.js';
import { initView } from './views';

window.CSP = window.CSP || cspApp();
CSP.init();

function cspApp() {
  const app = {
    data: {},
    screenSize: null,
    init() {
      const controller = document.body.dataset.controller;
      const action = document.body.dataset.action;
      document.addEventListener('turbo:load', (e) => {
        console.log('turbo:load (once)', e)
        addAllListeners();
        initView(controller, action);
      }, { once: true });
    }
  }
  return app;
}

function addAllListeners(e) {
  addTurboListeners();
  [companies, profile].forEach(controller => controller.addListeners());
}

function addTurboListeners() {
  document.addEventListener('turbo:load', turboCallbacks.onLoad)
  document.addEventListener('turbo:render', turboCallbacks.onRender)
  document.addEventListener('turbo:visit', turboCallbacks.onVisit)
  document.addEventListener('turbo:before-fetch-request', turboCallbacks.onBeforeFetchRequest)
  document.addEventListener('turbo:before-fetch-response', turboCallbacks.onBeforeFetchResponse)
  document.addEventListener('turbo:before-cache', turboCallbacks.onBeforeCache)
}

// function onMenuItemClick(e) {
//   const isMenuItem = (
//     e.target.closest('a') && (e.target.closest('a').getAttribute('href').match(/\/settings|\/user-profile/))
//   );
//   if (isMenuItem) {
//     const workflowTabs = document.querySelectorAll(
//       'a[href*="prospect"], a[href*="curate"], a[href*="promote"], a[href*="measure"]'
//     );
//     const thisDropdown = e.target.closest('li.dropdown');
//     const otherDropdown = thisDropdown.nextElementSibling || thisDropdown.previousElementSibling;
//     workflowTabs.forEach(tab => tab.parentElement.classList.remove('active'));
//     thisDropdown.classList.add('active');
//     otherDropdown.classList.remove('active');
//   }
// }