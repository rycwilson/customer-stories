import './jquery';   // creates global $, jQuery
import 'jquery-ujs/src/rails';
import 'jquery-ui/dist/jquery-ui';
import './bootstrap';

import "@hotwired/turbo-rails";
import './controllers';
import * as turboCallbacks from './turbo_callbacks.js';

import DataTable from 'datatables.net-bs';
window.DataTable = DataTable;
import 'datatables.net-rowgroup';

import 'summernote/dist/summernote';

import cookies from 'js-cookie';
window.Cookies = cookies;

import TomSelect from './tomselect.js';
window.TomSelect = TomSelect;

window.CSP = window.CSP || appFactory();
window.CSP.init();

function appFactory(): CustomerStoriesApp {
  const parseCurrentUser = (): User | null => {
    try {
      const parsedData: any = JSON.parse(document.body.dataset.currentUser || '');
      if (typeof parsedData === 'object' && parsedData !== null && 'id' in parsedData && 'full_name' in parsedData) {
        const { id, full_name } = parsedData;
        return { id, full_name };
      }
    } catch (error) {
      return null;
    }
    return null;
  }
  return {
    currentUser: parseCurrentUser(),
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

interface CustomerStoriesApp {
  readonly currentUser: User | null;
  // screenSize: string;
  init(): void;
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