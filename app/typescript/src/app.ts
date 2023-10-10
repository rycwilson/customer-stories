import Rails from '@rails/ujs';
// ajax:beforeSend: Triggered before an AJAX request is sent.
// ajax:before: Triggered before an element is replaced with the response content during an AJAX request.
// ajax:success: Triggered when an AJAX request is successful.
// ajax:error: Triggered when an AJAX request encounters an error.
// ajax:complete: Triggered when an AJAX request is complete, regardless of success or error.
// ajax:stopped: Triggered when an AJAX request is halted before completion.
// ajax:aborted: Triggered when an AJAX request is aborted by the user.
// ajax:after: Triggered after an element is replaced with the response content during an AJAX request.
// ajax:file:validate: Triggered before an AJAX file upload begins to validate the selected file.
// ajax:file:beforeSerialize: Triggered before serializing form data for an AJAX file upload.
// ajax:file:serialize: Triggered when serializing form data for an AJAX file upload.
// ajax:file:beforeSubmit: Triggered before submitting a form via AJAX when a file is involved.

import * as Turbo from "@hotwired/turbo";
// import * as turboCallbacks from '../turbo_callbacks';

import './jquery';   // creates global $, jQuery
// import 'jquery-ui/dist/jquery-ui';
import './bootstrap';

import './controllers';

import { parseDatasetObject } from './utils';

CSP ||= appFactory();
CSP.init();

function appFactory(): CustomerStoriesApp {
  return {
    customerWins: undefined,
    contributions: undefined,
    currentUser: parseDatasetObject(document.body, 'currentUser', 'id', 'full_name'),
    // screenSize: null,
    init() {
      Rails.start();
      Turbo.start();
      document.addEventListener('turbo:load', (e) => {
        console.log('turbo:load (once)')
        addAllListeners();
        // initView(controller, action);
      }, { once: true });
    }
  }
}

function addAllListeners() {
  addTurboListeners();
  // [companies, profile].forEach(controller => controller.addListeners());
}

function addTurboListeners() {
  // document.addEventListener('turbo:load', turboCallbacks.onLoad)
  // document.addEventListener('turbo:click', turboCallbacks.onClick)
  // document.addEventListener('turbo:render', turboCallbacks.onRender)
  // document.addEventListener('turbo:before-visit', turboCallbacks.onBeforeVisit)
  // document.addEventListener('turbo:visit', turboCallbacks.onVisit)
  // document.addEventListener('turbo:before-fetch-request', turboCallbacks.onBeforeFetchRequest)
  // document.addEventListener('turbo:before-fetch-response', turboCallbacks.onBeforeFetchResponse)
  // document.addEventListener('turbo:before-cache', turboCallbacks.onBeforeCache)
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