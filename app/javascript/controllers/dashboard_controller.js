import { Controller } from "@hotwired/stimulus";

export default class DashboardController extends Controller {
  static targets = ['tab', 'tabPanel', 'subPanel'];

  initialize() {
    console.log('dashboard initialize()')
    this.workflowStage = this.element.dataset.workflowStage;
    window.onpopstate = this.showActiveTabPanel;

    this.tabTargets.forEach(tab => {
      const isActive = tab.parentElement.classList.contains('active');
      if (isActive) {
        this.initTabPanel(tab.getAttribute('aria-controls'));
          // .then remove loading spinner
      } else {
        $(tab).one('show.bs.tab', () => this.initTabPanel(tab.getAttribute('aria-controls')));
      }
    })

    // const controller = this.application.getControllerForElementAndIdentifier()
    // document.addEventListener('DOMContentLoaded', (e) => )
  }

  showActiveTabPanel() {
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

  initTabPanel(panelId) {
    this.subPanelTargets
      .filter(subPanel => subPanel.closest(`#${panelId}`))
      .forEach(subPanel => {
        subPanel.dataset.controller = subPanel.dataset.controllerName;
        subPanel.removeAttribute('controller-name');
      });
  }

  get customerWins() {
    // return customer wins table target datatable data
  }
}
