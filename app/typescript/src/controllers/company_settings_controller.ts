import { Controller } from '@hotwired/stimulus';
import { visit as turboVisit } from '@hotwired/turbo';
import Cookies from 'js-cookie';

export default class CompanySettingsController extends Controller<HTMLDivElement> {
  static targets = ['tab'];
  declare tabTargets: [HTMLAnchorElement];

  get activeTab() {
    return this.tabTargets.find(tab => (
      (tab.parentElement as HTMLLIElement).classList.contains('active')
    )) as HTMLAnchorElement;
  }

  get validTabNames() {
    return this.tabTargets.map(tab => tab.hash.replace('-panel', ''));
  }

  connect() {
    // console.log('connect company settings')
    this.addTabListeners();
    this.initSidebar();
    // window.scrollTo(0, 0);
  }
  
  addTabListeners() {
    this.tabTargets.forEach(tab => {
      $(tab)
        .on('click', (e: JQuery.TriggeredEvent) => {
          const tabHash = e.currentTarget.hash;
          const locationHash = tabHash.replace('-panel', '');
          turboVisit(location.href.replace(/#.+$/, locationHash), { action: 'replace' })
        })
        .on('show.bs.tab', (e: JQuery.TriggeredEvent) => {
          const tabHash = e.target.hash;
          // window.scrollTo(0, 0);
          window.addEventListener('scroll', (e) => { window.scrollTo(0, 0) }, { once: true });
          Cookies.set('csp-company-settings-tab', tabHash);
        });
    });
  }
  
  // tab hashes are appended with '-panel' to prevent auto-scrolling on page load
  initSidebar() {
    let activeTab: HTMLAnchorElement | undefined;
    let navCookie: string | undefined;
    const defaultTab = <HTMLAnchorElement>this.tabTargets[0];
    
    const tabMatchesLocation = (tab: HTMLAnchorElement) => tab.hash.replace('-panel', '') === location.hash;
    const showPage = (tab: HTMLAnchorElement) => {
      $(tab)
        .one('shown.bs.tab', () => this.element.classList.add('has-active-tab'))
        .tab('show');
    }
    if (activeTab = this.tabTargets.find(tab => tabMatchesLocation(tab))) {
      showPage(activeTab);
    } else if (navCookie = Cookies.get('csp-company-settings-tab')) {
      activeTab = this.tabTargets.find(tab => tab.hash === navCookie);
      if (activeTab) {
        showPage(activeTab)
      } else {
        showPage(defaultTab);
      }
    } else {  
      showPage(defaultTab);
    }
  }
}