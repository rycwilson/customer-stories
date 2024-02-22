import { Controller } from '@hotwired/stimulus';
import Cookies from 'js-cookie';

export default class CompanySettingsController extends Controller<HTMLDivElement> {
  static targets = ['tab'];
  declare tabTargets: [HTMLAnchorElement];

  get activeTab() {
    return this.tabTargets.find(tab => (
      (tab.parentElement as HTMLLIElement).classList.contains('active')
    )) as HTMLAnchorElement;
  }

  connect() {
    // console.log('connect company settings')
    this.addTabListeners();
    this.initSidebar();
    // window.scrollTo(0, 0);
  }
  
  addTabListeners() {
    this.tabTargets.forEach(tab => {
      $(tab).on('show.bs.tab', (e: JQuery.TriggeredEvent) => {
        const tabHash = e.target.hash;
        // debugger;
        window.addEventListener('scroll', (e) => { window.scrollTo(0, 0) }, { once: true });
        location.hash = tabHash.replace('-panel', '');
        Cookies.set('csp-company-settings-tab', tabHash);
        // window.scrollTo(0, 0);
      })
    });
  }
  
  // tab hashes are appended with '-panel' to prevent auto-scrolling on page load
  initSidebar() {
    let activeTab: HTMLAnchorElement | undefined;
    let navCookie: string | undefined;
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
      if (activeTab) showPage(activeTab);
    } else {  
      showPage(this.tabTargets[0] as HTMLAnchorElement);
    }
  }
}