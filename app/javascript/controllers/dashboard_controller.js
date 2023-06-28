import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static outlets = ['new-contributor-modal'];
  static targets = [
    'tab', 'tabPanel', 'subPanel', 'customerWinsTab', 'customerWinsFilter', 'contributorsTab', 'contributorsFilter',
  ];
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
    const { panel, resourceClassName } = e.detail;

    // wait for datatable to render
    setTimeout(() => panel.classList.add(`${resourceClassName}-did-load`));
  }

  addCustomerWinContributors({ detail: { successId } }) {
    $(this.contributorsTabTarget).one('shown.bs.tab', () => {
      $(this.newContributorModalOutlet.element).modal('show');
      // $('select.new-contributor.customer').prop('disabled', true).val(customerId).trigger('change');
      // $('select.new-contributor.success').prop('disabled', true).val(successId).trigger('change');
    });
    this.showCustomerWinContributors({ detail: { successId } });
  }

  showCustomerWinContributors({ detail: { successId } }) {
    this.contributorsFilterTarget.tomselect.setValue(`success-${successId}`);
    $(this.contributorsTabTarget).one('shown.bs.tab', () => scrollTo(0, 65));
    $(this.contributorsTabTarget).tab('show');
      
    // TODO: change filters IF necessary to find customer win
    // all filters enabled (nothing hidden)
    // $('.contributors .checkbox-filter').prop('checked', true).trigger('change');
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
        const hasNotConnected = !subPanel.dataset.controller;
        if (hasNotConnected) subPanel.setAttribute('data-controller', subPanel.id); 
      });
  }
}
