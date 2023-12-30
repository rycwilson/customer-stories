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
    this.initSidebar();
    this.addTabListeners();
  }
  
  addTabListeners() {
    this.tabTargets.forEach(tab => {
      $(tab).on('show.bs.tab', (e) => {
        const tabHash = e.target.hash;
        Cookies.set('csp-company-settings-tab', tabHash);
        location.hash = tabHash.replace('edit-', '');
        window.scrollTo(0, 0);
      })
    });
  }
  
  // check that the current active tab matches the hash fragment in the url; might be a mismatch e.g. if cookies disabled
  initSidebar() {
    const tabMatchesLocation = (tab: HTMLAnchorElement) => tab.hash.replace('edit-', '') === location.hash;
    if (tabMatchesLocation(this.activeTab)) {
      console.log('yes')
      this.showPage();
    } else {
      console.log('no')
      const activeTab = this.tabTargets.find(tab => tabMatchesLocation(tab));
      if (activeTab) {
        $(activeTab).one('shown.bs.tab', this.showPage.bind(this)).tab('show');
      } else {
        // default tab
      }
    }
  }

  showPage() {
    console.log('showPage()')

    this.element.classList.add('has-active-tab');
  }
}