import jquery from './jquery.js';   // creates global $, jQuery
import {} from 'jquery-ujs/src/rails.js';
import {} from 'jquery-ui/dist/jquery-ui.js';
import {} from './bootstrap.js';
import { Turbo } from 'turbo-rails-1.3.2/app/assets/javascripts/turbo.js';
import * as turboCallbacks from './turbo_callbacks';
import Cookies from 'js-cookie';

import dashboard from './views/dashboard.js';

document.addEventListener('turbo:load', onPageLoad, { once: true });

function onPageLoad() {
  console.log('turbo:load (once)', e)
  
  addTurboListeners();
  
  document.addEventListener('click', onWorkflowTabClick);
  
  // window.onpopstate = showActiveTabContent;
  // document.addEventListener('click', onMenuItemClick);
  
  dashboard.addListeners();
}

function addTurboListeners() {
  document.addEventListener('turbo:load', turboCallbacks.onLoad)
  document.addEventListener('turbo:render', turboCallbacks.onRender)
  document.addEventListener('turbo:visit', turboCallbacks.onVisit)
  document.addEventListener('turbo:before-fetch-request', turboCallbacks.onBeforeFetchRequest)
  document.addEventListener('turbo:before-fetch-response', turboCallbacks.onBeforeFetchResponse)
  document.addEventListener('turbo:before-cache', turboCallbacks.onBeforeCache)
}

function onWorkflowTabClick(e) {
  const isWorkflowTab = (
    e.target.getAttribute('aria-controls') && 
    e.target.getAttribute('aria-controls').match(/prospect|curate|promote|measure/)
  ); 
  if (isWorkflowTab) {
    e.preventDefault();
    workflowTurboVisit(e.target);
  }
}

function workflowTurboVisit(link) {
  const newWorkflowPath = `/${link.getAttribute('href').slice(1, link.getAttribute('href').length)}`;
  const currentlyOnDashboard = document.body.classList.contains('companies') && document.body.classList.contains('show');
  if (currentlyOnDashboard) {
    // replacing state ensures turbo:false for the first tab state
    history.replaceState({ turbo: false }, null, location.pathname);
    history.pushState(
      { turbo: { restorationIdentifier: Turbo.navigator.history.restorationIdentifier } }, 
      null, 
      newWorkflowPath
    );
  } else {
    // const dropdowns = document.querySelectorAll('#company-nav .nav-settings > li.dropdown');
    // dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
    Turbo.visit(newWorkflowPath);
  }
}

function onMenuItemClick(e) {
  const isMenuItem = (
    e.target.closest('a') && (e.target.closest('a').getAttribute('href').match(/\/settings|\/user-profile/))
  );
  if (isMenuItem) {
    const workflowTabs = document.querySelectorAll(
      'a[href*="prospect"], a[href*="curate"], a[href*="promote"], a[href*="measure"]'
    );
    const thisDropdown = e.target.closest('li.dropdown');
    const otherDropdown = thisDropdown.nextElementSibling || thisDropdown.previousElementSibling;
    workflowTabs.forEach(tab => tab.parentElement.classList.remove('active'));
    thisDropdown.classList.add('active');
    otherDropdown.classList.remove('active');
  }
}

function showActiveTabContent(e) {
  const workflowMatch = location.pathname.match(/(prospect|curate|promote|measure)(\/(\w|-)+)?/);
  const workflowStage = workflowMatch && workflowMatch[1];
  const curateView = workflowStage === 'curate' && (workflowMatch[2] ? 'story' : 'stories');
  if (workflowStage) {
    let tab = $(`.nav-workflow a[href="#${workflowStage}"]`)[0]
    console.log(workflowStage, tab)
    $(`.nav-workflow a[href="#${workflowStage}"]`).tab('show');
    // document.querySelector(`.nav-workflow a[href="#${workflowStage}"]`).click()
    if (curateView) {
      curateView === 'stories' ? $('a[href=".curate-stories"]').tab('show') : $('a[href=".edit-story"]').tab('show');
      
      // don't scroll to panel
      setTimeout(() => scrollTo(0, 0));
      if (curateView === 'stories') {
        // $('#curate-filters .curator')
        //   .val($('#curate-filters .curator').children(`[value="${CSP.current_user.id}"]`).val())
        //   .trigger('change', { auto: true });
      }
    }
  }
}