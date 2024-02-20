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

interface ReadyState {
  [key: string]: boolean;
  customerWins: boolean;
  contributions: boolean;
  promotedStories: boolean;
};

export default class DashboardController extends Controller<HTMLDivElement> {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'tab', 
    'tabPanel',
    'customerWins', 
    'customerWinsTab', 
    'addCustomerWinBtn', 
    'customerWinsFilter', 
    'contributors', 
    'contributorsTab', 
    'addContributorBtn', 
    'contributorsFilter',
    'promotedStories', 
    'promotedStoriesTab', 
    'promotedStoriesFilter'
  ];
  declare readonly tabTargets: HTMLAnchorElement[];
  declare readonly tabPanelTargets: HTMLDivElement[];
  declare readonly customerWinsTarget: HTMLDivElement;
  declare readonly customerWinsTabTarget: HTMLAnchorElement;
  declare readonly addCustomerWinBtnTarget: HTMLButtonElement;
  declare readonly customerWinsFilterTarget: HTMLSelectElement;
  declare readonly contributorsTarget: HTMLDivElement;
  declare readonly contributorsTabTarget: HTMLAnchorElement;
  declare readonly addContributorBtnTarget: HTMLButtonElement;
  declare readonly contributorsFilterTarget: HTMLSelectElement;
  declare readonly promotedStoriesTarget: HTMLDivElement;
  declare readonly promotedStoriesFilterTarget: HTMLSelectElement;

  static values = { activeTab: { type: String, default: '' } };    
  declare activeTabValue: DashboardTab | null;

  panelTimers: Record<DashboardTab.Prospect | DashboardTab.Promote, number> = { prospect: 0, promote: 0 };

  readyState: ReadyState = new Proxy(
    { customerWins: false, contributions: false, promotedStories: false },
    { set: this.onReadyStateChange.bind(this) }
  )
  
  connect() {
    // console.log('connect dashboard')
    addEventListener('popstate', this.showActiveTabPanel);
  }

  disconnect() {
    removeEventListener('popstate', this.showActiveTabPanel);
  }

  onResourceReady(e: CustomEvent) {
    const { currentTarget: tabPanel } = e;
    const { resourceName } = e.detail; 
    this.readyState[resourceName] = true;
  }

  onReadyStateChange(
    this: DashboardController,
    resources: { customerWins: boolean, contributions: boolean, promotedStories: boolean }, 
    resourceName: 'customerWins' | 'contributions' | 'promotedStories', 
    isReady: boolean
  ) {
    const setPanelReady = (panelId: DashboardTab.Prospect | DashboardTab.Promote) => {
      const panel = this.getTabPanel(panelId);
      // console.log(`${panel.id} is ready`)
      window.clearTimeout(this.panelTimers[panelId]);
      panel.classList.remove('loading');
      panel.classList.add('ready');
    };
    if (resources[resourceName] === isReady) return false;  // no change => ignore
    resources[resourceName] = isReady;
    if (/customerWins|contributions/.test(resourceName) && resources.customerWins && resources.contributions) {
      setPanelReady(DashboardTab.Prospect);
    } else if (resources.promotedStories) {
      setPanelReady(DashboardTab.Promote);
    }
    return true;
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

  activeTabValueChanged(activeTab: DashboardTab) {
    this.initTabPanel(activeTab);
  }

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

  initTabPanel(tab: DashboardTab) {
    if (/prospect|promote/.test(tab)) {
      this.panelTimers[tab as DashboardTab.Prospect | DashboardTab.Promote] = window.setTimeout(() => {
        // console.log(`${tab} is loading`)
        this.getTabPanel(tab).classList.add('loading');
      }, 1000);
    }
    if (tab === DashboardTab.Prospect) {
      this.customerWinsTarget.setAttribute('data-resource-init-value', 'true');
      this.contributorsTarget.setAttribute('data-resource-init-value', 'true');
    } else if (tab === DashboardTab.Promote) {
      this.promotedStoriesTarget.setAttribute('data-resource-init-value', 'true');
    }
  }

  getTabPanel(panelId: DashboardTab) {
    return this.tabPanelTargets.find(panel => panel.id === panelId) as HTMLDivElement;
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
    if (href) Cookies.set(`csp-${this.activeTabValue || 'story'}-tab`, href);
  }

  get activeTabPanel() {
    return this.tabPanelTargets.find(panel => panel.id === this.activeTabValue);
  }
}
