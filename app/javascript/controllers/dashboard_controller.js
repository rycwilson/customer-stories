import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ['tab', 'tabPanel', 'subPanel'];
  static values = { activeTab: String };    // prospect | curate | promote | measure

  connect() {
    addEventListener('popstate', this.showActiveTabPanel);
  }

  disconnect() {
    removeEventListener('popstate', this.showActiveTabPanel);
  }

  onTabClick(e) {
    this.activeTabValue = e.target.getAttribute('aria-controls');
  }

  activeTabValueChanged() {
    const activeTabPanel = this.tabPanelTargets.find(panel => panel.id === this.activeTabValue);
    this.initTabPanel(activeTabPanel);
  }

  dataDidLoad(e) {
    const { panelId, resourceClassName } = e.detail;
    const panel = this.tabPanelTargets.find(panel => panel.id === panelId);
    panel.classList.add(`${resourceClassName}-did-load`);
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

  initTabPanel(panel) {
    this.subPanelTargets
      .filter(subPanel => panel.contains(subPanel))
      .forEach(subPanel => {
        if (!subPanel.dataset.controller) {
          subPanel.dataset.controller = subPanel.dataset.controllerId; 
          subPanel.removeAttribute('controller-id');
        }
      });
  }

  // get customerWins() {
    // return customer wins table target datatable data
  // }
}
