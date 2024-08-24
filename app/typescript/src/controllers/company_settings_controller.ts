import { Controller } from '@hotwired/stimulus';
import Cookies from 'js-cookie';
import { navigator as turboNavigator, type FrameElement, type TurboFrameLoadEvent } from '@hotwired/turbo';
import { debounce } from '../utils';

export default class CompanySettingsController extends Controller<HTMLDivElement> {
  static targets = [
    'tab', 
    'invitationTemplateSelect',
    'invitationTemplateTurboFrame',
    'invitationTemplateForm'
  ];
  declare tabTargets: HTMLAnchorElement[];
  declare invitationTemplateSelectTargets: TomSelectInput[];
  declare invitationTemplateTurboFrameTargets: FrameElement[];
  declare invitationTemplateFormTargets: HTMLFormElement[];

  resizeHandler = debounce(this.onResize.bind(this), 200);
  invitationTemplateFrameLoadHandler = this.onInvitationTemplateFrameLoad.bind(this);
  currentScreen: ScreenSize | undefined = undefined;

  get activeTab() {
    return this.tabTargets.find(tab => (
      (tab.parentElement as HTMLLIElement).classList.contains('active')
    )) as HTMLAnchorElement;
  }

  get validTabNames() {
    return this.tabTargets.map(tab => tab.hash.replace('-panel', ''));
  }

  connect() {
    this.initSidebar();
    this.currentScreen = this.visibleInvitationTemplateSelect.id.match(/(?<screen>(sm|md-lg)$)/).groups.screen;
    // window.scrollTo(0, 0);

    this.invitationTemplateTurboFrameTargets.forEach(frame => {
      frame.addEventListener('turbo:frame-load', this.invitationTemplateFrameLoadHandler);
    });
    window.addEventListener('resize', this.resizeHandler);
  }

  disconnect() {
    this.invitationTemplateTurboFrameTargets.forEach(frame => {
      frame.removeEventListener('turbo:frame-load', this.invitationTemplateFrameLoadHandler);
    });
    window.removeEventListener('resize', this.resizeHandler);
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
    const templateId = +select.value || null;
    const isNewTemplate = isNaN(+select.value);
    const action = isNewTemplate ? 'new' : (templateId ? 'edit' : null);
    const screen = select.id.match(/(?<screen>(sm|md-lg)$)/)?.groups?.screen;
    const turboFrame = (
      this.invitationTemplateTurboFrameTargets.find(frame => frame.classList.contains(screen))
    ) as FrameElement;
    let path = action ? turboFrame.dataset[`${action}TemplatePath`] : null;
    select.tomselect.control_input.blur();
    if (isNewTemplate) {
      path += `?template_name=${encodeURIComponent(select.value)}`;
    } else if (templateId) {
      path = (path as string).replace(':id', templateId.toString());
    } else {
      turboFrame.innerHTML = '';
    }
    turboFrame.setAttribute('id', action ? `${action}-invitation-template-${screen}` : '');
    turboFrame.setAttribute('src', path || ''); 
  }

  // TODO: save changes to open template first
  copyInvitationTemplate() {
    // const turboFrame = this.invitationTemplateTurboFrameTarget as FrameElement;
    // const templateId = this.invitationTemplateFormTarget.getAttribute('action')?.split('/').pop() as string;
    // if (typeof +templateId === 'number') {
    //   turboFrame.setAttribute('id', 'new-invitation-template');
    //   turboFrame.setAttribute('src', turboFrame.dataset.newTemplatePath + `?source_template_id=${templateId}`);
    // }
  }

  restoreInvitationTemplate() {
  }

  deleteInvitationTemplate() {
  }

  onInvitationTemplateFrameLoad({ target: turboFrame }: { target: FrameElement }) {
    const isNewTemplate = /new/.test(turboFrame.id);
    const isDefaultTemplate = !!turboFrame.querySelector('input[name*="[name]"][readonly]');
    const screen = turboFrame.id.match(/(?<screen>(sm|md-lg)$)/)?.groups?.screen;
    const select = this.invitationTemplateSelectTargets.find(select => select.id.includes(screen));
    const toolbar = select.parentElement;
    if (isNewTemplate) {
      select.tomselect.control_input.previousElementSibling.textContent = '\u2013 New Template \u2013';
    }
    toolbar.querySelector('.invitation-template__restore')!.classList.toggle('hidden', !isDefaultTemplate);
    toolbar.querySelector('.invitation-template__delete')!.classList.toggle('hidden', isDefaultTemplate);
    toolbar.querySelector('.btn-group').classList.toggle('hidden', isNewTemplate);
  }

  get visibleInvitationTemplateSelect() {
    return this.invitationTemplateSelectTargets.find(select => select.checkVisibility());
  }

  onResize() {
    const newSelect = this.visibleInvitationTemplateSelect;
    const newScreen = newSelect.id.match(/(?<screen>(sm|md-lg)$)/)?.groups?.screen;
    const oldSelect = this.invitationTemplateSelectTargets.find(select => select !== newSelect);
    const shouldSyncView = newScreen !== this.currentScreen && oldSelect.value;
    if (shouldSyncView) {
      const oldScreen = this.currentScreen;
      const newFrame = <FrameElement>this.invitationTemplateTurboFrameTargets.find(frame => frame.classList.contains(newScreen));
      const oldFrame = <FrameElement>this.invitationTemplateTurboFrameTargets.find(frame => frame !== newFrame);
      const copyFields = () => {
        const newName = <HTMLInputElement>newFrame.querySelector(`input[class*="${newScreen}"][name*="name"]`);
        const oldName = <HTMLInputElement>oldFrame.querySelector(`input[class*="${oldScreen}"][name*="name"]`);
        newName.value = oldName.value;
        const newSubject = <HTMLInputElement>newFrame.querySelector(`input[class*="${newScreen}"][name*="subject"]`);
        const oldSubject = <HTMLInputElement>oldFrame.querySelector(`input[class*="${oldScreen}"][name*="subject"]`);
        newSubject.value = oldSubject.value;
      };
      const copyCode = () => {
        const newEditor = <HTMLElement>newFrame.querySelector(`.invitation-template__summernote--${newScreen}`);
        const oldEditor = <HTMLElement>oldFrame.querySelector(`.invitation-template__summernote--${oldScreen}`);
        $(newEditor).summernote('code', $(oldEditor).summernote('code'));
      };
      const copyForm = () => {
        copyFields();
        copyCode();
      };
      if (newSelect.value !== oldSelect.value) {
        newFrame.addEventListener('turbo:frame-load', copyForm, { once: true });
        newSelect.tomselect.setValue(oldSelect.value);
      } else {
        copyForm();
      }
      this.currentScreen = newScreen;
    }
  } 
}