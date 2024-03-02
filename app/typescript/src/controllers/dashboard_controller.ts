import { Controller } from "@hotwired/stimulus";
import Cookies from 'js-cookie';
import ModalController from './modal_controller';
import { parseDatasetObject } from '../utils';
import { type TomInput } from 'tom-select/dist/types/types';
import { visit as turboVisit } from '@hotwired/turbo';

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
    'promotedStoriesFilter',
    'story'
  ];
  declare readonly tabTargets: HTMLAnchorElement[];
  declare readonly tabPanelTargets: HTMLDivElement[];
  declare readonly customerWinsTarget: HTMLDivElement;
  declare readonly customerWinsTabTarget: HTMLAnchorElement;
  declare readonly addCustomerWinBtnTarget: HTMLButtonElement;
  declare readonly customerWinsFilterTarget: TomInput;
  declare readonly contributorsTarget: HTMLDivElement;
  declare readonly contributorsTabTarget: HTMLAnchorElement;
  declare readonly addContributorBtnTarget: HTMLButtonElement;
  declare readonly contributorsFilterTarget: TomInput;
  declare readonly storyTarget: HTMLDivElement;
  declare readonly promotedStoriesTarget: HTMLDivElement;
  declare readonly promotedStoriesFilterTarget: TomInput;
  declare readonly promotedStoriesTabTarget: HTMLAnchorElement;

  static values = { activeTab: { type: String, default: '' } };    
  declare activeTabValue: DashboardTab | null;

  spinnerTimers: Record<DashboardTab.Prospect | 'story' | DashboardTab.Promote, number> = { 
    prospect: 0, 
    story: 0, 
    promote: 0 
  };

  readyState: ReadyState = new Proxy(
    { customerWins: false, contributions: false, storyContributions: false, promotedStories: false },
    { set: this.onReadyStateChange.bind(this) }
  )
  
  connect() {
    // console.log('connect dashboard')
    addEventListener('popstate', this.showActiveTabPanel);
  }

  disconnect() {
    removeEventListener('popstate', this.showActiveTabPanel);
  }

  onResourceLoading({ currentTarget: tabPanel }: { currentTarget: HTMLDivElement }) {
    window.setTimeout(() => tabPanel.classList.add('loading'), 1000);
  }

  onResourceReady({ detail: { resourceName } }: { detail: { resourceName: ResourceName }}) {
    this.readyState[resourceName] = true;
  }

  onReadyStateChange(
    this: DashboardController,
    resources: { [key in ResourceName]: boolean }, 
    resourceName: ResourceName, 
    isReady: boolean
  ) {
    const setReady = (containerId: DashboardTab.Prospect | 'story' | DashboardTab.Promote) => {
      const container = containerId === 'story' ? this.storyTarget : this.getTabPanel(containerId);
      // console.log(`${panel.id} is ready`)
      window.clearTimeout(this.spinnerTimers[containerId]);
      container.classList.remove('loading');
      container.classList.add('ready');
    };
    if (resources[resourceName] === isReady) return false;  // no change => ignore
    resources[resourceName] = isReady;
    if (/customerWins|contributions/.test(resourceName) && resources.customerWins && resources.contributions) {
      setReady(DashboardTab.Prospect);
    } else if (resourceName === 'storyContributions') {
      setReady('story');
    } else if (resources.promotedStories) {
      setReady(DashboardTab.Promote);
    }
    return true;
  }

  onTabClick({ currentTarget: tab }: { currentTarget: HTMLAnchorElement }) {
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
    this.contributorsFilterTarget.tomselect!.setValue(`success-${customerWinId}`);
    $(this.contributorsTabTarget)
      .one('shown.bs.tab', () => scrollTo(0, 65))
      .tab('show');
      
    // TODO: change filters IF necessary to find customer win
    // all filters enabled (nothing hidden)
    // $('.contributors .checkbox-filter').prop('checked', true).trigger('change');
  }

  showContributionCustomerWin({ currentTarget: link }: { currentTarget: HTMLAnchorElement }) {
    if (!link.dataset.customerWinId) return false;
    this.customerWinsFilterTarget.tomselect!.setValue(`success-${link.dataset.customerWinId}`);
    $(this.customerWinsTabTarget)
      .one('shown.bs.tab', () => scrollTo(0, 65))
      .tab('show');
    // TODO: open the customer win child row
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

  editStory({ currentTarget: link }: { currentTarget: HTMLAnchorElement }) {
    if (link.dataset.storyPath && link.dataset.storyTab) {
      Cookies.set(`csp-story-tab`, `#${link.dataset.storyTab}`);
      turboVisit(link.dataset.storyPath);
    }
  }

  initTabPanel(tab: DashboardTab) {
    if (tab === DashboardTab.Prospect || tab === DashboardTab.Promote) {
      this.spinnerTimers[tab] = window.setTimeout(() => {
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
    Cookies.set(`csp-${this.activeTabValue || 'story'}-tab`, href);
  }

  get activeTabPanel() {
    return this.tabPanelTargets.find(panel => panel.id === this.activeTabValue);
  }
}
