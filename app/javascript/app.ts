import './jquery';   // creates global $, jQuery
import 'jquery-ujs/src/rails';
import 'jquery-ui/dist/jquery-ui';
import './bootstrap';

import "@hotwired/turbo-rails";
import './controllers';
import * as turboCallbacks from './turbo_callbacks';

import DataTable from 'datatables.net-bs';
window.DataTable = DataTable;
import 'datatables.net-rowgroup';

import 'summernote/dist/summernote';

import TomSelect from './tomselect';
window.TomSelect = TomSelect;

import { parseDatasetObject } from './util';

CSP ||= appFactory();
CSP.init();

function appFactory(): CustomerStoriesApp {
  return {
    customerWins: undefined,
    contributions: undefined,
    currentUser: parseDatasetObject(document.body, 'currentUser', 'id', 'full_name'),
    // screenSize: null,
    init() {
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
  document.addEventListener('turbo:load', turboCallbacks.onLoad)
  document.addEventListener('turbo:click', turboCallbacks.onClick)
  document.addEventListener('turbo:render', turboCallbacks.onRender)
  document.addEventListener('turbo:before-visit', turboCallbacks.onBeforeVisit)
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