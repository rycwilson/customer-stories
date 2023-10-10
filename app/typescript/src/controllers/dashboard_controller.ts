import { Controller } from "@hotwired/stimulus";
import Cookies from 'js-cookie';
import ModalController from './modal_controller';
import { parseDatasetObject } from '../utils';

// excludes stories#edit, which also renders the dashboard
enum DashboardTab {
  Prospect = 'prospect',
  Curate = 'curate',
  Promote = 'promote',
  Measure = 'measure'
}

export default class DashboardController extends Controller<HTMLDivElement> {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'tab', 'tabPanel', 'subPanel', 'customerWinsTab', 'customerWinsFilter', 'contributorsTab', 'contributorsFilter',
    'addCustomerWinBtn', 'addContributorBtn'
  ];
  declare readonly tabTargets: HTMLAnchorElement[];
  declare readonly tabPanelTargets: HTMLDivElement[];
  declare readonly subPanelTargets: HTMLDivElement[];
  declare readonly customerWinsTabTarget: HTMLAnchorElement;
  declare readonly customerWinsFilterTarget: HTMLSelectElement;
  declare readonly contributorsTabTarget: HTMLAnchorElement;
  declare readonly contributorsFilterTarget: HTMLSelectElement;
  declare readonly addCustomerWinBtnTarget: HTMLButtonElement;
  declare readonly addContributorBtnTarget: HTMLButtonElement;

  static values = { activeTab: { type: String, default: '' } };    
  declare activeTabValue: DashboardTab | null;

  connect() {
    // console.log('connect dashboard')
    addEventListener('popstate', this.showActiveTabPanel);
  }

  disconnect() {
    removeEventListener('popstate', this.showActiveTabPanel);
  }

  onTabClick({ target: tab }: { target: EventTarget }) {
    if (!(tab instanceof HTMLAnchorElement)) return;
    const tabName = tab.getAttribute('aria-controls');
    if (tabName) {
      if (Object.values<string>(DashboardTab).includes(tabName)) {
        const setActiveTab = () => this.activeTabValue = tabName as DashboardTab;
        $(tab).one('shown.bs.tab', () => setTimeout(setActiveTab));
      } else {
        console.error(`Unrecognized dashboard tab: ${tabName}`);
      }
    }
  }

  activeTabValueChanged() {
    this.initTabPanel(this.activeTabPanel);
  }
  
  // dataDidLoad(e: Event) {
  //   const { panel, resourceClassName } = e.detail;

  //   // wait for datatable to render
  //   setTimeout(() => panel.classList.add(`${resourceClassName}-did-load`));
  // }

  addCustomerWinContributors({ target: a }: { target: EventTarget }) {
    if (!(a instanceof HTMLAnchorElement)) return;
    const showModal = () => {
      const turboFrameAttrs: TurboFrameAttributes | null = parseDatasetObject(a, 'turboFrameAttrs', 'id', 'src');
      if (turboFrameAttrs) {
        this.modalOutlet.titleValue = 'New Contributor';
        this.modalOutlet.turboFrameAttrsValue = turboFrameAttrs;
        this.modalOutlet.show();
      }
    };
    if (this.showingCustomerWins()) {
      const customerWinId: string = a.dataset.customerWinId || '';
      if (!customerWinId) {
        console.error("Unknown CustomerWin") 
        return;
      }
      $(this.contributorsTabTarget).one('shown.bs.tab', showModal);
      this.showCustomerWinContributors(customerWinId);
    } else if (this.showingContributors()) {
      showModal();
    }
  }

  // inviteCustomerWinContributors({ target: dataset})

  showCustomerWinContributors(customerWinId: string) {
    // console.log(`showCustomerWinContributors(${customerWinId})`)
    this.contributorsFilterTarget.tomselect.setValue(`success-${customerWinId}`);
    $(this.contributorsTabTarget).one('shown.bs.tab', () => scrollTo(0, 65));
    $(this.contributorsTabTarget).tab('show');
      
    // TODO: change filters IF necessary to find customer win
    // all filters enabled (nothing hidden)
    // $('.contributors .checkbox-filter').prop('checked', true).trigger('change');
  }

  showActiveTabPanel() {
    const workflowMatch = location.pathname.match(/(?<workflowStage>prospect|curate|promote|measure)(\/(\w|-)+)?/);
    const workflowStage = workflowMatch?.groups?.workflowSTage
    // const curateView = workflowStage === 'curate' && (workflowMatch[2] ? 'story' : 'stories');
    if (workflowStage) {
      $(`.nav-workflow a[href="#${workflowStage}"]`).tab('show');
      // document.querySelector(`.nav-workflow a[href="#${workflowStage}"]`).click()
      // if (curateView) {
      //   curateView === 'stories' ? $('a[href=".curate-stories"]').tab('show') : $('a[href=".edit-story"]').tab('show');
        
        // don't scroll to panel
        // setTimeout(() => scrollTo(0, 0));
        // if (curateView === 'stories') {
          // $('#curate-filters .curator')
          //   .val($('#curate-filters .curator').children(`[value="${CSP.current_user.id}"]`).val())
          //   .trigger('change', { auto: true });
        // }
      // }
    }
  }

  initTabPanel(panel: HTMLDivElement | undefined) {
    if (!panel) return;
    switch (panel.id) {
      case 'prospect':
        return this.subPanelTargets
          .filter(subPanel => panel.contains(subPanel))
          .forEach(subPanel => { 
            const hasNotConnected = !subPanel.dataset.controller;
            // if (hasNotConnected) subPanel.setAttribute('data-controller', subPanel.id); 
            if (hasNotConnected) subPanel.setAttribute('data-controller', 'resource'); 
          });
      case 'curate':
      case 'promote':
      case 'measure':
    }
  }

  showingCustomerWins() {
    return this.activeTabValue === 'prospect' && this.customerWinsTabTarget.getAttribute('aria-expanded') === 'true';
  }

  showingContributors() {
    return this.activeTabValue === 'prospect' && this.contributorsTabTarget.getAttribute('aria-expanded') === 'true';
  }

  setNavCookie({ currentTarget: a }: { currentTarget: EventTarget }) {
    if (!(a instanceof HTMLAnchorElement)) return;
    const href = a.getAttribute('href') || ''; 
    if (href) Cookies.set(`csp-${this.activeTabValue}-tab`, href);
  }

  get activeTabPanel() {
    return this.tabPanelTargets.find(panel => panel.id === this.activeTabValue);
  }
}
