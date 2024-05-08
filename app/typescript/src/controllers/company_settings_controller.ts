import { Controller } from '@hotwired/stimulus';
import Cookies from 'js-cookie';
import { 
  navigator as turboNavigator, 
  type FrameElement, 
  type TurboBeforeCacheEvent } from '@hotwired/turbo';

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
  
  
  // tab hashes are appended with '-panel' to prevent auto-scrolling on page load
  initSidebar() {
    let activeTab: HTMLAnchorElement | undefined;
    let navCookie: string | undefined;
    const defaultTab = <HTMLAnchorElement>this.tabTargets[0];
    const showPage = (tab: HTMLAnchorElement) => {
      $(tab).one('shown.bs.tab', () => this.element.classList.add('has-active-tab')).tab('show');
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
      this.whenInvitationTemplateFrameLoads(this.headlineNewInvitationTemplate);
    } else if (templateId) {
      path = (path as string).replace(':id', templateId.toString());
    } else {
      turboFrame.innerHTML = '';
    }
    if (action) {
      const showButtons = () => {
        const isDefaultTemplate = !!this.invitationTemplateFormTarget.querySelector('input[name*="[name]"][readonly]');
        this.invitationTemplateRestoreBtnTarget.classList.toggle('hidden', !(isNewTemplate || isDefaultTemplate));
        this.invitationTemplateDeleteBtnTarget.classList.toggle('hidden', !isNewTemplate && !isDefaultTemplate);
        this.invitationTemplateToolbarTarget.classList.toggle('hidden', isNewTemplate);
      };
      this.whenInvitationTemplateFrameLoads(showButtons);
    }
    turboFrame.setAttribute('id', action ? `${action}-invitation-template` : '');
    turboFrame.setAttribute('src', path || ''); 
  }

  // TODO: save changes to open template first
  copyInvitationTemplate() {
    const turboFrame = this.invitationTemplateTurboFrameTarget as FrameElement;
    const templateId = this.invitationTemplateFormTarget.getAttribute('action')?.split('/').pop() as string;
    if (typeof +templateId === 'number') {
      this.whenInvitationTemplateFrameLoads(this.headlineNewInvitationTemplate);
      turboFrame.setAttribute('id', 'new-invitation-template');
      turboFrame.setAttribute('src', turboFrame.dataset.newTemplatePath + `?source_template_id=${templateId}`);
    }
  }

  restoreInvitationTemplate() {
  }

  deleteInvitationTemplate() {
  }

  whenInvitationTemplateFrameLoads(callback: () => void) {
    this.invitationTemplateTurboFrameTarget.addEventListener('turbo:frame-load', callback.bind(this), { once: true })
  }

  headlineNewInvitationTemplate() {
    this.invitationTemplateSelectTarget.tomselect.control_input.previousElementSibling.textContent = '\u2013 New Template \u2013';
    const templateNameField = <HTMLInputElement>this.invitationTemplateFormTarget.querySelector('input[name*="[name]"]');
    if (templateNameField) {
      templateNameField.focus();
      templateNameField.setSelectionRange(templateNameField.value.length, templateNameField.value.length);
    }
  }
}