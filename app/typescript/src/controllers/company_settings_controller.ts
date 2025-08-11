import { Controller } from '@hotwired/stimulus';
import type ModalController from './modal_controller';
import Cookies from 'js-cookie';

export default class CompanySettingsController extends Controller {
  static outlets = ['modal'];
  declare modalOutlet: ModalController;

  static targets = ['tab'];
  declare tabTargets: HTMLAnchorElement[];

  get activeTab() {
    return <HTMLAnchorElement>this.tabTargets.find(tab => (<HTMLLIElement>tab.parentElement).classList.contains('active'));
  }

  get validTabNames() {
    return this.tabTargets.map(tab => tab.hash.replace('-panel', ''));
  }

  connect() {
    this.initSidebar();
  }
  
  // tab hashes are appended with '-panel' to prevent auto-scrolling on page load
  initSidebar() {
    let activeTab: HTMLAnchorElement | undefined;
    let navCookie: string | undefined;
    const defaultTab = <HTMLAnchorElement>this.tabTargets.find(tab => tab.getAttribute('href') === '#account-panel');
    const showPage = (tab: HTMLAnchorElement) => {
      $(tab).one('shown.bs.tab', () => {
        this.element.classList.add('has-active-tab');

        // only the contributor invitations panel is concerned with screen size
        // const setCurrentScreen = () => {
        //   this.currentScreen = this.visibleInvitationTemplateSelect.id.match(/(?<screen>(sm|md-lg)$)/).groups.screen;
        // }
        if (tab.href == '#contributor-invitations-panel') {
          // setCurrentScreen();
        } else {
          const [contributorInvitationsTab] = (
            this.tabTargets.filter(tab => tab.getAttribute('href') == '#contributor-invitations-panel')
          )
          // contributorInvitationsTab.addEventListener('shown.bs.tab', setCurrentScreen, { once: true });
        }
      }).tab('show');
    }
    this.addTabListeners();
    if (activeTab = this.tabTargets.find(tab => tab.hash.replace('-panel', '') === location.hash)) {
      showPage(activeTab);
    } else if (navCookie = Cookies.get('csp-company-settings-tab')) {
      activeTab = this.tabTargets.find(tab => tab.hash === navCookie);
      showPage(activeTab ? activeTab : defaultTab);
    } else {  
      showPage(defaultTab);
    }
  }

  onCtasFrameLoad(e: Event) {
    // window.scrollTo(0, 0);
    if (this.modalOutlet.element.classList.contains('in')) this.modalOutlet.hide();
  }
  
  addTabListeners() {
    this.tabTargets.forEach(tab => {
      $(tab)
        .on('click', (e: JQuery.TriggeredEvent) => {
          const tabHash = e.currentTarget.hash;
          const locationHash = tabHash.replace('-panel', '');
          history.replaceState(
            { turbo: { restorationIdentifier: Turbo.navigator.history.restorationIdentifier } }, 
            '', 
            locationHash
          );
        })
        .on('shown.bs.tab', (e: JQuery.TriggeredEvent) => {
          const tabHash = e.target.hash;
          // window.scrollTo(0, 0);
          // window.addEventListener('scroll', (e) => { window.scrollTo(0, 0) }, { once: true });
          Cookies.set('csp-company-settings-tab', tabHash);
        });
    });
  }
}