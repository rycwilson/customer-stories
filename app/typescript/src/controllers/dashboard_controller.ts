import { Controller } from "@hotwired/stimulus";
import Cookies from 'js-cookie';
import type { ModalController, ToastController } from '.';
import { visit as turboVisit, type TurboVisitEvent } from '@hotwired/turbo';
import { onToggleSidebar } from '../utils';

enum DashboardTab {
  Curate = 'curate',
  Promote = 'promote',
  Measure = 'measure',
  Story = 'story'
}

type ResourceId = (
  'stories' |
  'customer-wins' |
  'contributions' |
  'story-contributions' |
  'promoted-stories' |
  'visitors' |
  'activity'
);

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
  private readonly spinnerTimers: { [key in DashboardTab]: number } = { 
    curate: 0,
    story: 0, 
    promote: 0,
    measure: 0 
  };
  private readonly readyState = new Proxy(
    {
      stories: false,
      'customer-wins': false,
      contributions: false,
      'story-contributions': false,
      'promoted-stories': false,
      visitors: false,
      activity: false
    },
    { set: this.handleReadyStateChanged.bind(this) }
  )
  
  connect() {
    addEventListener('popstate', this.onPopStateOrTurboVisit);
    document.documentElement.addEventListener('turbo:visit', this.onPopStateOrTurboVisit)
  }

  disconnect() {
    removeEventListener('popstate', this.onPopStateOrTurboVisit);
    document.documentElement.removeEventListener('turbo:visit', this.onPopStateOrTurboVisit)
  }

  handleResourceLoading(
    { target: _resourcePanel, currentTarget: dashboardPanel }: { target: HTMLElement, currentTarget: HTMLElement }
  ) {
    // console.log(`loading: ${resourcePanel.id}`)
    this.spinnerTimers[dashboardPanel.id as DashboardTab] = window.setTimeout(() => {
      if (!dashboardPanel.classList.contains('ready')) {
        dashboardPanel.classList.add('loading');
      };
    }, 1000);
  }

  handleResourceReady({ target: resourcePanel }: { target: HTMLElement }) {
    // console.log(`ready: ${resourcePanel.id}`)
    this.readyState[resourcePanel.id as ResourceId] = true;
  }

  handleReadyStateChanged(
    resources: { [key in ResourceId]: boolean }, resourceId: ResourceId, isReady: boolean
  ) {
    const setReady = (panelId: DashboardTab) => {
      const panel = panelId === 'story' ? 
        this.storyTarget :
        <HTMLElement>this.tabPanelTargets.find(panel => panel.id === panelId);
      panel.classList.add('ready');
      window.clearTimeout(this.spinnerTimers[panelId]);
      panel.classList.remove('loading');
      setTimeout(() => panel.querySelector(':scope > .spinner')?.remove(), 500);
    };
    if (resources[resourceId] === isReady) return true;  // no change => ignore
    resources[resourceId] = isReady;
    const curateResources: readonly ResourceId[] = ['stories', 'customer-wins', 'contributions'];
    if (curateResources.includes(resourceId) && curateResources.every(id => resources[id])) {
      setReady(DashboardTab.Curate);
    } else if (resourceId === 'story-contributions') {
      setReady(DashboardTab.Story);
    } else if (resourceId === 'promoted-stories') {
      setReady(DashboardTab.Promote);
    } else if (resourceId === 'visitors') {
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

  activeTabValueChanged(activeTab: DashboardTab) {
    if (activeTab) {
      this.initTabPanel(activeTab);
    }
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
      .setAttribute('data-resource-row-id-value', contributionId.toString());
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
    // console.log(`Initializing ${tab} panel...`);
    if (tab === DashboardTab.Curate) {
      [this.storiesTarget, this.contributionsTarget, this.customerWinsTarget].forEach(target => {
        target.setAttribute(`data-${target.id}-init-value`, 'true');
      })
    } else if (tab === DashboardTab.Promote) {
      this.promotedStoriesTarget.setAttribute('data-promoted-stories-init-value', 'true');
    } else if (tab === DashboardTab.Measure) {
      this.visitorsTarget.setAttribute('data-visitors-init-value', 'true');
    }
  }

  get showingCustomerWins() {
    return (
      this.activeTabValue === DashboardTab.Curate && 
      this.customerWinsTabTarget.getAttribute('aria-expanded') === 'true'
    );
  }

  get showingContributors() {
    return (
      this.activeTabValue === DashboardTab.Curate && 
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
