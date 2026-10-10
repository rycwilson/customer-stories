import { Controller } from "@hotwired/stimulus";
import Cookies from 'js-cookie';
import type { ModalController, ToastController } from '.';
import { visit as turboVisit, type TurboVisitEvent } from '@hotwired/turbo';
import { onToggleSidebar } from '../utils';

// excludes stories#edit, which also renders the dashboard
enum DashboardTab {
  Prospect = 'prospect',
  Curate = 'curate',
  Promote = 'promote',
  Measure = 'measure'
}

export default class DashboardController extends Controller {
  static outlets = ['modal', 'toast'];
  static targets = [
    'sidebar',
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
    'stories',
    'story',
    'visitors',
    'activity',
  ];
  static values = { 
    activeTab: { type: String, default: '' },
    filters: { type: Object, default: undefined }
  };    

  declare readonly modalOutlet: ModalController;
  declare readonly toastOutlet: ToastController;
  declare filtersValue: DashboardFilters | undefined;
  declare readonly sidebarTargets: HTMLElement[];
  toggleSidebar = onToggleSidebar.bind(this);

  private declare readonly tabTargets: HTMLAnchorElement[];
  private declare readonly tabContentTarget: HTMLDivElement;
  private declare readonly tabPanelTargets: HTMLDivElement[];
  private declare readonly customerWinsTarget: HTMLDivElement;
  private declare readonly customerWinsTabTarget: HTMLAnchorElement;
  private declare readonly customerWinsSearchSelectTarget: TomSelectInput;
  private declare readonly contributionsTarget: HTMLDivElement;
  private declare readonly contributionsTabTarget: HTMLAnchorElement;
  private declare readonly contributionsSearchSelectTarget: TomSelectInput;
  private declare readonly storiesTarget: HTMLDivElement;
  private declare readonly storyTarget: HTMLDivElement;
  private declare readonly promotedStoriesTarget: HTMLDivElement;
  private declare readonly promotedStoriesTabTarget: HTMLAnchorElement;
  private declare readonly promotedStoriesSearchSelectTarget: TomSelectInput;
  private declare readonly visitorsTarget: HTMLDivElement;
  private declare readonly activityTarget: HTMLDivElement;
  private declare activeTabValue: DashboardTab | null;
  private readonly onPopStateOrTurboVisit = this.handleTabRestoration.bind(this);
  private readonly spinnerTimers: { [key: string]: number } = { 
    prospect: 0,
    curate: 0,
    story: 0, 
    promote: 0,
    measure: 0 
  };
  private readyState = new Proxy(
    {
      customerWins: false,
      contributions: false,
      storyContributions: false,
      stories: false,
      promotedStories: false,
      visitors: false,
      activity: false
    },
    { set: this.handleChangeReadyState.bind(this) }
  )
  
  connect() {
    addEventListener('popstate', this.onPopStateOrTurboVisit);
    document.documentElement.addEventListener('turbo:visit', this.onPopStateOrTurboVisit)
  }

  disconnect() {
    removeEventListener('popstate', this.onPopStateOrTurboVisit);
    document.documentElement.removeEventListener('turbo:visit', this.onPopStateOrTurboVisit)
  }

  handleResourceLoading(e: CustomEvent) {
    const tabPanel = <HTMLElement>e.currentTarget;
    this.spinnerTimers[tabPanel.id] = window.setTimeout(() => {
      if (!tabPanel.classList.contains('ready')) {
        tabPanel.classList.add('loading');
      };
    }, 1000);
  }

  handleResourceReady(e: CustomEvent<{ resourceName: ResourceName }>) {
    // console.log('resource ready', resourceName)
    const panel = <HTMLElement>e.currentTarget;
    const { resourceName } = e.detail;
    this.readyState[resourceName] = true;
    setTimeout(() => panel.querySelector(':scope > .spinner')?.remove());
  }

  handleChangeReadyState(
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
      setReady(DashboardTab.Measure);
    }
    return true;
  }

  handleTabClick({ currentTarget: tab }: { currentTarget: HTMLAnchorElement }) {
    const tabName = tab.getAttribute('aria-controls');
    if (tabName === 'story') return;

    $(tab).one(
      'shown.bs.tab',
      () => setTimeout(() => this.activeTabValue = tabName as DashboardTab)
    );
    history.pushState(
      { turbo: { restorationIdentifier: Turbo.navigator.history.restorationIdentifier } }, 
      '', 
      `/${tabName}`
    );
  }

  handleChangeStoriesCurator(e: CustomEvent<{ 'curator': number | null }>) {
    this.filtersValue = e.detail;
  }

  activeTabValueChanged(activeTab: DashboardTab) {
    if (activeTab) this.initTabPanel(activeTab);
  }

  filtersValueChanged(newFilters: DashboardFilters, oldVal: DashboardFilters) {
    if (JSON.stringify(newFilters) === JSON.stringify(oldVal)) return;

    [
      this.customerWinsTarget,
      this.contributionsTarget,
      this.storiesTarget,
      this.promotedStoriesTarget,
      this.visitorsTarget
    ]
      .forEach(target => {
        const oldFilters = (
          JSON.parse(
            <string>target.getAttribute(`data-${target.dataset.controller}-filters-value`)
          )
        );
        target.setAttribute(
          `data-${target.dataset.controller}-filters-value`,
          JSON.stringify({ ...oldFilters, ...newFilters })
        );
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

  showContributor({ detail: { contributionId } }: { detail: { contributionId: number } }) {
    this.contributionsTarget
      .setAttribute('data-contributions-row-id-value', contributionId.toString());
    $(this.contributionsTabTarget).tab('show');
  }

  showContributionCustomerWin({ currentTarget: link }: { currentTarget: HTMLAnchorElement }) {
    if (!link.dataset.customerWinId) return false;
    this.customerWinsSearchSelectTarget.tomselect.setValue(`success-${link.dataset.customerWinId}`);
    $(this.customerWinsTabTarget)
      // .one('shown.bs.tab', () => scrollTo(0, 65))
      .tab('show');
    // TODO: open the customer win child row
  }

  handleTabRestoration(e: TurboVisitEvent | PopStateEvent) {
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

  showToast({ detail: toast }: { detail: Toast }) {
    if (toast.flash) this.toastOutlet.flashValue = toast.flash;
    if (toast.errors?.length) this.toastOutlet.errorsValue = toast.errors;
  }
  
  setNavCookie({ currentTarget: link }: { currentTarget: HTMLAnchorElement }) {
    const href = link.getAttribute('href') as string; 
    Cookies.set(`csp-${this.activeTabValue || 'edit-story'}-tab`, href);
  }

  get activeTabPanel() {
    return this.tabPanelTargets.find(panel => panel.id === this.activeTabValue);
  }
}
