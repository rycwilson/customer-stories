import { Controller } from "@hotwired/stimulus";
import Cookies from 'js-cookie';
import type ModalController from './modal_controller';
import { parseDatasetObject } from '../utils';
import { visit as turboVisit, type TurboVisitEvent } from '@hotwired/turbo';

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
  storyContributions: boolean;
  promotedStories: boolean;
  visitors: boolean;
  activity: boolean;
};

export default class DashboardController extends Controller {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'tab', 
    'tabContent',
    'tabPanel',
    'customerWins', 
    'customerWinsTab', 
    'customerWinsSearchSelect', 
    'contributions', 
    'contributionsTab', 
    'contributionsSearchSelect',
    'promotedStories', 
    'promotedStoriesTab', 
    'promotedStoriesSearchSelect',
    'story',
    'visitors',
    'activity',
  ];
  declare readonly tabTargets: HTMLAnchorElement[];
  declare readonly tabContentTarget: HTMLDivElement;
  declare readonly tabPanelTargets: HTMLDivElement[];
  declare readonly customerWinsTarget: HTMLDivElement;
  declare readonly customerWinsTabTarget: HTMLAnchorElement;
  declare readonly customerWinsSearchSelectTarget: TomSelectInput;
  declare readonly contributionsTarget: HTMLDivElement;
  declare readonly contributionsTabTarget: HTMLAnchorElement;
  declare readonly contributionsSearchSelectTarget: TomSelectInput;
  declare readonly storyTarget: HTMLDivElement;
  declare readonly promotedStoriesTarget: HTMLDivElement;
  declare readonly promotedStoriesTabTarget: HTMLAnchorElement;
  declare readonly promotedStoriesSearchSelectTarget: TomSelectInput;
  declare readonly visitorsTarget: HTMLDivElement;
  declare readonly activityTarget: HTMLDivElement;

  static values = { 
    activeTab: { type: String, default: '' },
    filters: { type: Object }
  };    
  declare activeTabValue: DashboardTab | null;
  declare filtersValue: { 'curator-id': number | null };
  
  tabRestorationListener = this.onTabRestoration.bind(this);
  spinnerTimers: { [key: string]: number } = { 
    prospect: 0,
    curate: 0,
    story: 0, 
    promote: 0,
    measure: 0 
  };
  readyState: ReadyState = new Proxy(
    {
      customerWins: false,
      contributions: false,
      storyContributions: false,
      stories: false,
      promotedStories: false,
      visitors: false,
      activity: false
    },
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
    this.spinnerTimers[tabPanel.id] = window.setTimeout(() => {
      if (!tabPanel.classList.contains('ready')) {
        tabPanel.classList.add('loading');
      };
    }, 1000);
  }

  onResourceReady({ detail: { resourceName } }: { detail: { resourceName: ResourceName }}) {
    // console.log('resource ready', resourceName)
    this.readyState[resourceName] = true;
  }

  onReadyStateChange(
    resources: { [key in ResourceName]: boolean }, resourceName: ResourceName, isReady: boolean
  ) {
    const setReady = (
      containerId: (
        DashboardTab.Prospect | 
        DashboardTab.Curate | 
        'story' | 
        DashboardTab.Promote | 
        DashboardTab.Measure
      )
    ) => {
      const container = containerId === 'story' ? this.storyTarget : this.getTabPanel(containerId);
      container.classList.add('ready');
      window.clearTimeout(this.spinnerTimers[containerId]);
      container.classList.remove('loading');
    };
    if (resources[resourceName] === isReady) return true;  // no change => ignore
    resources[resourceName] = isReady;
    if (/customerWins|contributions/.test(resourceName) && resources.customerWins && resources.contributions) {
      setReady(DashboardTab.Prospect);
    } else if (resourceName === 'stories') {
      setReady(DashboardTab.Curate);
    } else if (resourceName === 'storyContributions') {
      setReady('story');
    } else if (resourceName === 'promotedStories') {
      setReady(DashboardTab.Promote);
    } else if (resourceName === 'visitors') {
      console.log('visitors ready')
      setReady(DashboardTab.Measure);
    }
    return true;
  }

  onTabClick({ currentTarget: tab }: { currentTarget: HTMLAnchorElement }) {
    const tabName = tab.getAttribute('aria-controls') as DashboardTab;
    $(tab).one('shown.bs.tab', () => setTimeout(() => this.activeTabValue = tabName as DashboardTab));
    history.pushState(
      { turbo: { restorationIdentifier: Turbo.navigator.history.restorationIdentifier } }, 
      '', 
      `/${tabName}`
    );
  }

  activeTabValueChanged(activeTab: DashboardTab) {
    if (activeTab) this.initTabPanel(activeTab);
  }

  filtersValueChanged(
    newVal: { 'curator-id': number | null },
    oldVal: { 'curator-id': number | null } | undefined
  ) {
    if (oldVal === undefined || JSON.stringify(newVal) === JSON.stringify(oldVal)) return;
    [this.customerWinsTarget, this.contributionsTarget, this.promotedStoriesTarget, this.visitorsTarget]
      .forEach(target => {
        const oldFilters = JSON.parse(<string>target.getAttribute(`data-${target.id}-filters-value`));
        const newFilters = { ...oldFilters, ...newVal };
        target.setAttribute(`data-${target.id}-filters-value`, JSON.stringify(newFilters));
      });
  }

  addCustomerWinContributors({ currentTarget: link }: { currentTarget: HTMLAnchorElement }) {
    const showModal = () => {
      // const turboFrameAttrs: TurboFrameAttributes | null = parseDatasetObject(link, 'turboFrameAttrs', 'id', 'src');
      // if (turboFrameAttrs) {
      //   this.modalOutlet.titleValue = 'New Contributor';
      //   this.modalOutlet.turboFrameAttrsValue = turboFrameAttrs;
      //   this.modalOutlet.show();
      // }
    };
    if (this.showingCustomerWins) {
      const customerWinId = link.dataset.customerWinId || '';
      $(this.contributionsTabTarget).one('shown.bs.tab', showModal);
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
    this.contributionsSearchSelectTarget.tomselect.setValue(`success-${customerWinId}`);
    $(this.contributionsTabTarget)
      // .one('shown.bs.tab', () => scrollTo(0, 65))
      .tab('show');
      
    // TODO: change filters IF necessary to find customer win
    // all filters enabled (nothing hidden)
    // $('.contributors .checkbox-filter').prop('checked', true).trigger('change');
  }

  showContributionCustomerWin({ currentTarget: link }: { currentTarget: HTMLAnchorElement }) {
    if (!link.dataset.customerWinId) return false;
    this.customerWinsSearchSelectTarget.tomselect.setValue(`success-${link.dataset.customerWinId}`);
    $(this.customerWinsTabTarget)
      // .one('shown.bs.tab', () => scrollTo(0, 65))
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
      this.customerWinsTarget.setAttribute('data-customer-wins-init-value', 'true');
      this.contributionsTarget.setAttribute('data-contributions-init-value', 'true');
    } else if (tab === DashboardTab.Promote) {
      this.promotedStoriesTarget.setAttribute('data-promoted-stories-init-value', 'true');
    } else if (tab === DashboardTab.Measure) {
      this.visitorsTarget.setAttribute('data-visitors-init-value', 'true');
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
      this.contributionsTabTarget.getAttribute('aria-expanded') === 'true'
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
