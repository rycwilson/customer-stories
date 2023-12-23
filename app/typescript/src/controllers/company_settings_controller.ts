import { Controller } from '@hotwired/stimulus';
import Cookies from 'js-cookie';

export default class CompanySettingsController extends Controller<HTMLDivElement> {
  static targets = ['tab', 'tabContent'];
  declare tabTargets: [HTMLAnchorElement];
  // declare tabContentTarget: HTMLDivElement;

  get activeTab() {
    return this.tabTargets.find(tab => (
      (tab.parentElement as HTMLLIElement).classList.contains('active')
    )) as HTMLAnchorElement;
  }

  connect() {
    // console.log('connect company settings')
    this.checkActiveTab();
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
  checkActiveTab() {
    const showPage = () => this.element.classList.add('has-correct-active-tab');
    const tabMatchesLocation = (tab: HTMLAnchorElement) => tab.hash.replace('edit-', '') === location.hash;
    if (tabMatchesLocation(this.activeTab)) {
      showPage();
    } else {
      const correctTab = this.tabTargets.find(tab => tabMatchesLocation(tab));
      if (correctTab) {
        $(correctTab).one('shown.bs.tab', showPage).tab('show');
      } else {
        // default tab
      }
    }
  }
}