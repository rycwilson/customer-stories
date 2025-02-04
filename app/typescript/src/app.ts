import Rails from '@rails/ujs';
import '@hotwired/turbo';
import * as turboCallbacks from './turbo_callbacks';

import './jquery';
import 'blueimp-file-upload';
import 'summernote';

// all needed for sortable
import 'jquery-ui/ui/data';
import 'jquery-ui/ui/scroll-parent';
import 'jquery-ui/ui/widgets/mouse';
import 'jquery-ui/ui/widgets/sortable';

import './bootstrap';
import './controllers';

import { parseDatasetObject } from './utils';

window.CSP ||= appFactory();
window.CSP.init();

// const observer = new MutationObserver(mutations => {
//   mutations.forEach(mutation => console.log(mutation));
// });
// observer.observe(document.documentElement, { childList: true, subtree: false } )

function appFactory(): CustomerStoriesApp {
  return {
    customerWins: undefined,
    contributions: undefined,
    stories: undefined,
    storyContributions: {},
    promotedStories: undefined,
    currentUser: parseDatasetObject(document.body, 'currentUser', 'id', 'full_name'),
    // screenSize: null,
    authToken: <string>(<HTMLMetaElement>document.head.querySelector('meta[name="csrf-token"]')).getAttribute('content'),
    init() {
      Rails.start();
      addTurboListeners();
    }
  }
}

function foo() {
  console.log('foo');
}

function addTurboListeners() {
  document.documentElement.addEventListener('turbo:load', turboCallbacks.onLoad)
  document.documentElement.addEventListener('turbo:click', turboCallbacks.onClick)
  document.documentElement.addEventListener('turbo:before-visit', turboCallbacks.beforeVisit)
  document.documentElement.addEventListener('turbo:visit', turboCallbacks.onVisit)
  document.documentElement.addEventListener('turbo:submit-start', turboCallbacks.onSubmitStart)
  document.documentElement.addEventListener('turbo:submit-end', turboCallbacks.onSubmitEnd)
  document.documentElement.addEventListener('turbo:before-render', turboCallbacks.beforeRender)
  document.documentElement.addEventListener('turbo:render', turboCallbacks.onRender)
  document.documentElement.addEventListener('turbo:frame-load', turboCallbacks.onFrameLoad)
  document.documentElement.addEventListener('turbo:before-frame-render', turboCallbacks.beforeFrameRender)
  document.documentElement.addEventListener('turbo:frame-render', turboCallbacks.onFrameRender)
  document.documentElement.addEventListener('turbo:before-fetch-request', turboCallbacks.beforeFetchRequest)
  document.documentElement.addEventListener('turbo:before-fetch-response', turboCallbacks.beforeFetchResponse)
  document.documentElement.addEventListener('turbo:before-cache', turboCallbacks.beforeCache)
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

