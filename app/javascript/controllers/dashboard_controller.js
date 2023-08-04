import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static outlets = ['modal'];
  static targets = [
    'tab', 'tabPanel', 'subPanel', 'customerWinsTab', 'customerWinsFilter', 'contributorsTab', 'contributorsFilter',
    'addCustomerWinBtn', 'addContributorBtn'
  ];
  static values = { 
    activeTab: String,    // prospect | curate | promote | measure
    story: { type: Object, default: {} }    // edit story
  };    

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
    this.initTabPanel(this.activeTabPanel);
  }
  
  storyValueChanged(newVal, oldVal) {
    if (newVal.id) {
      
    }
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
          if (hasNotConnected) subPanel.setAttribute('data-controller', subPanel.id); 
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

  // this method will be bound to 'customer-wins' or 'contributors' controller
  initTableDisplayOptionsPopover(isReset) {
    const btn = this.tableDisplayOptionsBtnTarget;
    const groupByResource = this.identifier === 'customer-wins' ? 'Customer' : 'Customer Win';
    const content = `
      <div class="form-horizontal">
        <div class="form-group">
          <label class="col-sm-3 control-label">Group</label>
          <div class="col-sm-9">
            <div class="checkbox">
              <label for="group-by-${groupByResource.toLowerCase().replace(/\s/g, '-')}">
                <input 
                  type="checkbox" 
                  id="group-by-${groupByResource.toLowerCase().replace(/\s/g, '-')}" 
                  data-action="table-display-options#toggleRowGroups"
                  ${this.datatableTarget.getAttribute('data-datatable-enable-row-groups-value') === 'true'  ? 'checked' : ''}>
                <span>&nbsp;&nbsp;by ${groupByResource}</span>
              </label>
            </div>
          </div>
        </div>
        ${Object.entries(this.checkboxFiltersValue).map(([filterId, filter], i) => (`
          <div class="form-group">
            <label class="col-sm-3 control-label">${i === 0 ? 'Show' : ''}</label>
            <div class="col-sm-9">
              <div class="checkbox">
                <label for="${filterId}">
                  <input 
                    type="checkbox" 
                    id="${filterId}" 
                    data-action="table-display-options#toggleFilter"
                    ${filter.checked ? 'checked' : ''}>
                  <span>&nbsp;&nbsp;${filter.label}</span>
                </label>
              </div>
            </div>
          </div>
        `)).join('')}
      </div>
    `;
    if (isReset) $(btn).data()['bs.popover'].options.content = content;
    else $(btn).popover({
      html: true,
      animation: false,
      container: 'body',
      title: 'Display Options',
      placement: 'auto right',
      template: `
        <div 
          class="popover" 
          data-controller="table-display-options" 
          data-table-display-options-dashboard-outlet=".dashboard"
          data-table-display-options-${this.identifier}-outlet="#${this.identifier}"
          role="tooltip">

          <div class="arrow"></div>
          <h3 class="popover-title label-secondary"></h3>
          <div class="popover-content">
            <!-- the template below goes here -->
          </div>
        </div>
      `,
      content
    });
  }

  get activeTabPanel() {
    return this.tabPanelTargets.find(panel => panel.id === this.activeTabValue);
  }
}
