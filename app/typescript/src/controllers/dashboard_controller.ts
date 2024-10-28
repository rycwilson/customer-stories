import { Controller } from "@hotwired/stimulus";
import Cookies from 'js-cookie';
import type ModalController from './modal_controller';
import { parseDatasetObject } from '../utils';
import { visit as turboVisit, navigator as turboNavigator } from '@hotwired/turbo';
import { type TurboVisitEvent } from "@hotwired/turbo";

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
    'tabContent',
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
    'promotedStoriesFilter',
    'story',
    'storyVisitors',
    'storyVisitorsTab',
    'recentActivity',
    'recentActivityTab'
  ];
  declare readonly tabTargets: HTMLAnchorElement[];
  declare readonly tabContentTarget: HTMLDivElement;
  declare readonly tabPanelTargets: HTMLDivElement[];
  declare readonly customerWinsTarget: HTMLDivElement;
  declare readonly customerWinsTabTarget: HTMLAnchorElement;
  declare readonly addCustomerWinBtnTarget: HTMLButtonElement;
  declare readonly customerWinsFilterTarget: TomSelectInput;
  declare readonly contributorsTarget: HTMLDivElement;
  declare readonly contributorsTabTarget: HTMLAnchorElement;
  declare readonly addContributorBtnTarget: HTMLButtonElement;
  declare readonly contributorsFilterTarget: TomSelectInput;
  declare readonly storyTarget: HTMLDivElement;
  declare readonly promotedStoriesTarget: HTMLDivElement;
  declare readonly promotedStoriesFilterTarget: TomSelectInput;
  declare readonly promotedStoriesTabTarget: HTMLAnchorElement;

  static values = { activeTab: { type: String, default: '' } };    
  declare activeTabValue: DashboardTab | null;
  
  tabRestorationListener = this.onTabRestoration.bind(this);
  spinnerTimers: { [key: string]: number } = { 
    prospect: 0,
    curate: 0,
    story: 0, 
    promote: 0 
  };
  readyState: ReadyState = new Proxy(
    { customerWins: false, contributions: false, stories: false, storyContributions: false, promotedStories: false },
    { set: this.onReadyStateChange.bind(this) }
  )

  initialize() {
  }
  
  connect() {
    addEventListener('popstate', this.tabRestorationListener);
    document.documentElement.addEventListener('turbo:visit', this.tabRestorationListener)
  }

  disconnect() {
    removeEventListener('popstate', this.tabRestorationListener);
    document.documentElement.removeEventListener('turbo:visit', this.tabRestorationListener)
  }

  onResourceLoading({ currentTarget: tabPanel }: { currentTarget: HTMLDivElement }) {
    this.spinnerTimers[tabPanel.id] = window.setTimeout(() => tabPanel.classList.add('loading'), 1000);
  }

  onResourceReady({ detail: { resourceName } }: { detail: { resourceName: ResourceName }}) {
    this.readyState[resourceName] = true;
  }

  onReadyStateChange(resources: { [key in ResourceName]: boolean }, resourceName: ResourceName, isReady: boolean) {
    const setReady = (containerId: DashboardTab.Prospect | DashboardTab.Curate | 'story' | DashboardTab.Promote) => {
      const container = containerId === 'story' ? this.storyTarget : this.getTabPanel(containerId);
      window.clearTimeout(this.spinnerTimers[containerId]);
      container.classList.remove('loading');
      container.classList.add('ready');
    };
    if (resources[resourceName] === isReady) return false;  // no change => ignore
    resources[resourceName] = isReady;
    if (/customerWins|contributions/.test(resourceName) && resources.customerWins && resources.contributions) {
      setReady(DashboardTab.Prospect);
    } else if (resourceName === 'stories') {
      setReady(DashboardTab.Curate);
    } else if (resourceName === 'storyContributions') {
      setReady('story');
    } else if (resources.promotedStories) {
      setReady(DashboardTab.Promote);
    }
    return true;
  }

  onTabClick({ currentTarget: tab }: { currentTarget: HTMLAnchorElement }) {
    const tabName = tab.getAttribute('aria-controls') as DashboardTab;
    $(tab).one('shown.bs.tab', () => setTimeout(() => this.activeTabValue = tabName as DashboardTab));
    history.pushState(
      { turbo: { restorationIdentifier: turboNavigator.history.restorationIdentifier } }, 
      '', 
      `/${tabName}`
    );
  }

  activeTabValueChanged(activeTab: DashboardTab) {
    if (activeTab) {
      this.initTabPanel(activeTab);
    }
  }

  addCustomerWinContributors({ currentTarget: link }: { currentTarget: HTMLAnchorElement }) {
    const showModal = () => {
      const turboFrameAttrs: TurboFrameAttributes | null = parseDatasetObject(link, 'turboFrameAttrs', 'id', 'src');
      if (turboFrameAttrs) {
        this.modalOutlet.titleValue = 'New Contributor';
        this.modalOutlet.turboFrameAttrsValue = turboFrameAttrs;
        this.modalOutlet.show();
      }
    };
    if (this.showingCustomerWins) {
      const customerWinId = link.dataset.customerWinId || '';
      $(this.contributorsTabTarget).one('shown.bs.tab', showModal);
      this.showCustomerWinContributors(customerWinId);
    } else if (this.showingContributors) {
      showModal();
    }
  }

  inviteCustomerWinContributors({ currentTarget: link }: { currentTarget: HTMLAnchorElement }) {
    const customerWinId = link.dataset.customerWinId || '';
    this.showCustomerWinContributors(customerWinId);
  }

  showCustomerWinContributors(customerWinId: string) {
    // console.log(`showCustomerWinContributors(${customerWinId})`)
    this.contributorsFilterTarget.tomselect.setValue(`success-${customerWinId}`);
    $(this.contributorsTabTarget)
      .one('shown.bs.tab', () => scrollTo(0, 65))
      .tab('show');
      
    // TODO: change filters IF necessary to find customer win
    // all filters enabled (nothing hidden)
    // $('.contributors .checkbox-filter').prop('checked', true).trigger('change');
  }

  showContributionCustomerWin({ currentTarget: link }: { currentTarget: HTMLAnchorElement }) {
    if (!link.dataset.customerWinId) return false;
    this.customerWinsFilterTarget.tomselect.setValue(`success-${link.dataset.customerWinId}`);
    $(this.customerWinsTabTarget)
      .one('shown.bs.tab', () => scrollTo(0, 65))
      .tab('show');
    // TODO: open the customer win child row
  }

  onTabRestoration(e: TurboVisitEvent | PopStateEvent) {
    const tab = location.pathname.slice(1);
    const isTabTarget = Object.values(DashboardTab).includes(tab as DashboardTab);
    if (isTabTarget) {
      // 'turbo:visit' event means the page could not be restored from cache and is being fetched;
      // Note 'cache' here implies browser cache, as caching was disabled for the companies#show page;
      // if the action is restore (i.e. stay on the dashboard) then current content should be hidden to avoid flicker
      if (e.type === 'turbo:visit') {
        const { action } = (e as TurboVisitEvent).detail;
        if (action === 'restore') this.tabContentTarget.classList.add('hidden');
      } else {
        jQuery(`.nav-workflow a[href="#${tab}"]`).tab('show');
      }
    }
  }

  editStory({ currentTarget: link }: { currentTarget: HTMLAnchorElement }) {
    if (link.dataset.storyPath && link.dataset.storyTab) {
      Cookies.set(`csp-edit-story-tab`, `#${link.dataset.storyTab}`);
      turboVisit(link.dataset.storyPath);
    }
  }

  initTabPanel(tab: DashboardTab) {
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

  get showingCustomerWins() {
    return (
      this.activeTabValue === DashboardTab.Prospect && 
      this.customerWinsTabTarget.getAttribute('aria-expanded') === 'true'
    );
  }

  get showingContributors() {
    return (
      this.activeTabValue === DashboardTab.Prospect && 
      this.contributorsTabTarget.getAttribute('aria-expanded') === 'true'
    );
  }

  setNavCookie({ currentTarget: link }: { currentTarget: HTMLAnchorElement }) {
    const href = link.getAttribute('href') as string; 
    Cookies.set(`csp-${this.activeTabValue || 'edit-story'}-tab`, href);
  }

  get activeTabPanel() {
    return this.tabPanelTargets.find(panel => panel.id === this.activeTabValue);
  }
}
