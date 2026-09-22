// import Rails from '@rails/ujs';
import '@hotwired/turbo';
import * as turboCallbacks from './turbo_callbacks';

import './jquery';

// The sortable widget is used for drag-dropping, others are dependencies
import 'jquery-ui/ui/version';
import 'jquery-ui/ui/widget';
import 'jquery-ui/ui/data';
import 'jquery-ui/ui/scroll-parent';
import 'jquery-ui/ui/widgets/mouse';
import 'jquery-ui/ui/widgets/sortable';

// The patch applied to blueimp-file-upload removes a nested version of jquery-ui that 
// conflicted with the version of jquery-ui already in use.
import 'blueimp-file-upload';
import 'summernote';
import './bootstrap';
import './controllers';

import { parseDatasetObject } from './utils';

window.CSP ||= appFactory();
window.CSP.init();

// this observer will report when the body element is replaced
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
    visitors: undefined,
    activity: undefined,
    currentUser: parseDatasetObject(document.body, 'currentUser', 'id', 'full_name'),
    // screenSize: null,
    authToken: <string>(<HTMLMetaElement>document.head.querySelector('meta[name="csrf-token"]')).getAttribute('content'),
    init() {
      // Rails.start();
      addTurboListeners(false);
    }
  }
}

function addTurboListeners(shouldAdd: boolean) {
  if (!shouldAdd) return;

  const listeners = [
    ['turbo:load', 'onLoad'],
    ['turbo:click', 'onClick'],
    ['turbo:before-visit', 'beforeVisit'],
    ['turbo:visit', 'onVisit'],
    ['turbo:submit-start', 'onSubmitStart'],
    ['turbo:submit-end', 'onSubmitEnd'],
    ['turbo:before-render', 'beforeRender'],
    ['turbo:render', 'onRender'],
    ['turbo:frame-load', 'onFrameLoad'],
    ['turbo:before-frame-render', 'beforeFrameRender'],
    ['turbo:frame-render', 'onFrameRender'],
    ['turbo:before-fetch-request', 'beforeFetchRequest'],
    ['turbo:before-fetch-response', 'beforeFetchResponse'],
    ['turbo:before-cache', 'beforeCache'],
  ] as const;
  
  listeners.forEach(([event, callback]) => {
    document.documentElement.addEventListener(event, turboCallbacks[callback]);
  });
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

