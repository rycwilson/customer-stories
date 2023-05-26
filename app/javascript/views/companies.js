import { Turbo } from 'turbo-rails-1.3.2/app/assets/javascripts/turbo.js';

import dashboard from './dashboard.js';

export default {

  show: {
    init() {
      console.log('init dashboard')
      const activeTab = document.querySelector(`a[href="${location.pathname.replace('/', '#')}"]`);
      const inactiveTabs = document.querySelectorAll('.nav-workflow > li:not(.active) > a');
      initTabPanel({ target: activeTab });
      inactiveTabs.forEach(tab => $(tab).one('show.bs.tab', initTabPanel));
    },
    addListeners() {
      console.log('dashboard listeners')
      document.addEventListener('click', onDashboardTabClick);
      window.onpopstate = showActiveTabContent;
      Object.keys(dashboard.panels).forEach(panel => dashboard.panels[panel].addListeners());
    }
  }, 

  edit: {
    init() {
      console.log('init company settings')
    },
    addListeners() {
      console.log('settings listeners')
    }
  },

  addListeners() {
    this.show.addListeners();
    this.edit.addListeners();
  }

}

function initTabPanel({ target }) {
  const tab = target;
  const panel = tab.getAttribute('aria-controls');
  if (panel.match(/prospect|curate|promote|measure/)) dashboard.panels[panel].init();
}

function showActiveTabContent(e) {
  const workflowMatch = location.pathname.match(/(prospect|curate|promote|measure)(\/(\w|-)+)?/);
  const workflowStage = workflowMatch && workflowMatch[1];
  const curateView = workflowStage === 'curate' && (workflowMatch[2] ? 'story' : 'stories');
  if (workflowStage) {
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

function onDashboardTabClick(e) {
  const isDashboardTab = (
    e.target.getAttribute('aria-controls') && 
    e.target.getAttribute('aria-controls').match(/prospect|curate|promote|measure/)
  ); 
  if (isDashboardTab) {
    e.preventDefault();
    dashboardTurboVisit(e.target);
  }
}

function dashboardTurboVisit(link) {
  const newDashboardPath = `/${link.getAttribute('href').slice(1, link.getAttribute('href').length)}`;
  const currentlyOnDashboard = document.body.classList.contains('companies') && document.body.classList.contains('show');
  if (currentlyOnDashboard) {
    // replacing state ensures turbo:false for the first tab state
    history.replaceState({ turbo: false }, null, location.pathname);
    history.pushState(
      { turbo: { restorationIdentifier: Turbo.navigator.history.restorationIdentifier } }, 
      null, 
      newDashboardPath
    );
  } else {
    // const dropdowns = document.querySelectorAll('#company-nav .nav-settings > li.dropdown');
    // dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
    Turbo.visit(newDashboardPath);
  }
}