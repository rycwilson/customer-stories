import { Controller } from "@hotwired/stimulus";

export default class extends Controller<HTMLDivElement> {
  static outlets = ['modal'];
  static targets = [
    'tab', 'tabPanel', 'subPanel', 'customerWinsTab', 'customerWinsFilter', 'contributorsTab', 'contributorsFilter',
    'addCustomerWinBtn', 'addContributorBtn'
  ];
  static values = { 
    activeTab: { type: String, default: '' }   // prospect | curate | promote | measure
  };    

  connect() {
    // console.log('connect dashboard')
    addEventListener('popstate', this.showActiveTabPanel);
  }

  disconnect() {
    removeEventListener('popstate', this.showActiveTabPanel);
  }

  onTabClick(e) {
    $(e.target).one('shown.bs.tab', () => setTimeout(() => this.activeTabValue = e.target.getAttribute('aria-controls')));
  }

  activeTabValueChanged(activeTab) {
    // console.log('activeTab', activeTab)
    if (activeTab) this.initTabPanel(this.activeTabPanel);
  }
  
  dataDidLoad(e) {
    const { panel, resourceClassName } = e.detail;

    // wait for datatable to render
    setTimeout(() => panel.classList.add(`${resourceClassName}-did-load`));
  }

  addCustomerWinContributors({ currentTarget: { dataset: { customerWinId, turboFrameAttrs } } }) {
    const showModal = () => {
      this.modalOutlet.titleValue = 'New Contributor';
      this.modalOutlet.turboFrameAttrsValue = JSON.parse(turboFrameAttrs);
      this.modalOutlet.show();
    };
    if (this.showingCustomerWins()) {
      $(this.contributorsTabTarget).one('shown.bs.tab', showModal);
      this.showCustomerWinContributors({ currentTarget: { dataset: { customerWinId } } });
    } else if (this.showingContributors()) {
      showModal();
    }
  }

  // inviteCustomerWinContributors({ target: dataset})

  showCustomerWinContributors({ currentTarget: { dataset: { customerWinId } } }) {
    // console.log(`showCustomerWinContributors(${customerWinId})`)
    this.contributorsFilterTarget.tomselect.setValue(`success-${customerWinId}`);
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
    if (panel.id === 'prospect') {
      this.subPanelTargets
        .filter(subPanel => panel.contains(subPanel))
        .forEach(subPanel => { 
          const hasNotConnected = !subPanel.dataset.controller;
          // if (hasNotConnected) subPanel.setAttribute('data-controller', subPanel.id); 
          if (hasNotConnected) subPanel.setAttribute('data-controller', 'resource'); 
        });
    }
  }

  // search customer wins or contributors
  searchTable(searchResults) {
    const subPanelCtrl = this;
    // console.log('searching', this.identifier, '...')
    const columnFilters = Object.entries(subPanelCtrl.checkboxFiltersValue)
      .filter(([filterId, filter]) => !filter.checked)
      .map(([filterId, filter]) => {
        if (filterId === 'show-wins-with-story')
          return { column: 'story', q: '^false$', regEx: true, smartSearch: false };
        else if (filterId === 'show-completed')
          return { column: 'status', q: '^((?!completed).)*$', regEx: true, smartSearch: false };
        else if (filterId === 'show-published')
          return { column: 'storyPublished', q: 'false', regEx: false, smartSearch: false }
        else 
          console.error('Unrecognized column filter');
      });
    subPanelCtrl.datatableTarget.setAttribute(
      'data-datatable-search-params-value', 
      JSON.stringify(Object.assign(
        { curatorId: subPanelCtrl.curatorSelectTarget.value },
        { columnFilters },
        searchResults ? { searchResults } : { filterVal: subPanelCtrl.filterSelectTarget.value }
      ))
    );
  }

  showingCustomerWins() {
    return this.activeTabValue === 'prospect' && this.customerWinsTabTarget.getAttribute('aria-expanded') === 'true';
  }

  showingContributors() {
    return this.activeTabValue === 'prospect' && this.contributorsTabTarget.getAttribute('aria-expanded') === 'true';
  }

  setNavCookie(e) {
    Cookies.set(`csp-${this.activeTabValue}-tab`, e.target.closest('a').getAttribute('href'));
  }

  get activeTabPanel() {
    return this.tabPanelTargets.find(panel => panel.id === this.activeTabValue);
  }
}
