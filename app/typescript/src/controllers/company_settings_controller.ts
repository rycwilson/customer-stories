import { Controller } from '@hotwired/stimulus';
import { navigator as turboNavigator } from '@hotwired/turbo';
import type { FrameElement } from '@hotwired/turbo';
import Cookies from 'js-cookie';
import { type TurboBeforeCacheEvent } from '@hotwired/turbo';

export default class CompanySettingsController extends Controller<HTMLDivElement> {
  static targets = [
    'tab', 
    'invitationTemplateSelect',
    'invitationTemplateToolbar', 
    'invitationTemplateRestoreBtn',
    'invitationTemplateDeleteBtn',
    'invitationTemplateTurboFrame',
    'invitationTemplateForm'
  ];
  declare tabTargets: [HTMLAnchorElement];
  declare invitationTemplateSelectTarget: TomSelectInput;
  declare invitationTemplateToolbarTarget: HTMLElement;
  declare invitationTemplateRestoreBtnTarget: HTMLButtonElement;
  declare invitationTemplateDeleteBtnTarget: HTMLButtonElement;
  declare invitationTemplateTurboFrameTarget: FrameElement;
  declare invitationTemplateFormTarget: HTMLFormElement;

  cacheListener = this.beforeCache.bind(this);

  get activeTab() {
    return this.tabTargets.find(tab => (
      (tab.parentElement as HTMLLIElement).classList.contains('active')
    )) as HTMLAnchorElement;
  }

  get validTabNames() {
    return this.tabTargets.map(tab => tab.hash.replace('-panel', ''));
  }

  connect() {
    console.log('connect company settings')
    this.addTabListeners();
    this.initSidebar();
    // window.scrollTo(0, 0);

    document.documentElement.addEventListener('turbo:before-cache', this.cacheListener);
  }

  disconnect() {
    console.log('disconnect company settings')
    document.documentElement.removeEventListener('turbo:before-cache', this.cacheListener);
  }

  beforeCache(e: TurboBeforeCacheEvent) {
    // console.log('turbo:before-cache\n', `${location.pathname}\n`, e)
  }
  
  addTabListeners() {
    this.tabTargets.forEach(tab => {
      $(tab)
        .on('click', (e: JQuery.TriggeredEvent) => {
          const tabHash = e.currentTarget.hash;
          const locationHash = tabHash.replace('-panel', '');
          history.replaceState(
            { turbo: { restorationIdentifier: turboNavigator.history.restorationIdentifier } }, 
            '', 
            locationHash
          );
        })
        .on('shown.bs.tab', (e: JQuery.TriggeredEvent) => {
          const tabHash = e.target.hash;
          window.scrollTo(0, 0);
          // window.addEventListener('scroll', (e) => { window.scrollTo(0, 0) }, { once: true });
          Cookies.set('csp-company-settings-tab', tabHash);
        });
    });
  }
  
  // tab hashes are appended with '-panel' to prevent auto-scrolling on page load
  initSidebar() {
    let activeTab: HTMLAnchorElement | undefined;
    let navCookie: string | undefined;
    const defaultTab = <HTMLAnchorElement>this.tabTargets[0];
    const showPage = (tab: HTMLAnchorElement) => {
      $(tab).one('shown.bs.tab', () => this.element.classList.add('has-active-tab')).tab('show');
    }
    if (activeTab = this.tabTargets.find(tab => tab.hash.replace('-panel', '') === location.hash)) {
      showPage(activeTab);
    } else if (navCookie = Cookies.get('csp-company-settings-tab')) {
      activeTab = this.tabTargets.find(tab => tab.hash === navCookie);
      showPage(activeTab ? activeTab : defaultTab);
    } else {  
      showPage(defaultTab);
    }
  }

  onChangeInvitationTemplate({ target: select }: { target: TomSelectInput }) {
    // console.log('change template', select)
    const templateId = +select.value || null;
    const isNewTemplate = isNaN(+select.value);
    const action = isNewTemplate ? 'new' : (templateId ? 'edit' : null);
    const turboFrame = this.invitationTemplateTurboFrameTarget;
    let path = action ? <string>turboFrame.dataset[`${action}TemplatePath`] : null;
    select.tomselect.control_input.blur();
    if (isNewTemplate) {
      path += `?template_name=${encodeURIComponent(select.value)}`;
      select.tomselect.control_input.previousElementSibling.textContent = '- New Template -';
    } else if (templateId) {
      path = (path as string).replace(':id', templateId.toString());
    } else {
      turboFrame.innerHTML = '';
    }
    if (action) {
      this.invitationTemplateTurboFrameTarget.addEventListener(
        'turbo:frame-load', 
        () => {
          const isDefault = !!this.invitationTemplateFormTarget.querySelector('input[name*="[name]"][readonly]');
          this.invitationTemplateRestoreBtnTarget.classList.toggle('hidden', !(isNewTemplate || isDefault));
          this.invitationTemplateDeleteBtnTarget.classList.toggle('hidden', !(isNewTemplate || !isDefault));
          this.invitationTemplateToolbarTarget.classList.toggle('hidden', isNewTemplate);
        }, 
        { once: true }
      );
    }
    turboFrame.setAttribute('id', action ? `${action}-invitation-template` : '');
    turboFrame.setAttribute('src', path || ''); 
  }
}