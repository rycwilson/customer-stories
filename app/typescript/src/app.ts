import Rails from '@rails/ujs';
import * as Turbo from "@hotwired/turbo";
import * as turboCallbacks from './turbo_callbacks';
import './jquery';
import './bootstrap';
import './controllers';

import { parseDatasetObject } from './utils';

window.CSP ||= appFactory();
window.CSP.init();

function appFactory(): CustomerStoriesApp {
  return {
    customerWins: undefined,
    contributions: undefined,
    promotedStories: undefined,
    currentUser: parseDatasetObject(document.body, 'currentUser', 'id', 'full_name'),
    // screenSize: null,
    init() {
      Rails.start();
      Turbo.start();
      document.documentElement.addEventListener('turbo:load', (e) => {
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
  // document.documentElement.addEventListener('turbo:load', turboCallbacks.onLoad)
  // document.documentElement.addEventListener('turbo:click', turboCallbacks.onClick)
  // document.documentElement.addEventListener('turbo:before-visit', turboCallbacks.onBeforeVisit)
  // document.documentElement.addEventListener('turbo:visit', turboCallbacks.onVisit)
  // document.documentElement.addEventListener('turbo:submit-start', turboCallbacks.onSubmitStart)
  // document.documentElement.addEventListener('turbo:submit-end', turboCallbacks.onSubmitEnd)
  // document.documentElement.addEventListener('turbo:before-render', turboCallbacks.onBeforeRender)
  // document.documentElement.addEventListener('turbo:render', turboCallbacks.onRender)
  // document.documentElement.addEventListener('turbo:frame-load', turboCallbacks.onFrameLoad)
  // document.documentElement.addEventListener('turbo:before-frame-render', turboCallbacks.onBeforeFrameRender)
  // document.documentElement.addEventListener('turbo:frame-render', turboCallbacks.onFrameRender)
  // document.documentElement.addEventListener('turbo:before-fetch-request', turboCallbacks.onBeforeFetchRequest)
  // document.documentElement.addEventListener('turbo:before-fetch-response', turboCallbacks.onBeforeFetchResponse)
  // document.documentElement.addEventListener('turbo:before-cache', turboCallbacks.onBeforeCache)
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