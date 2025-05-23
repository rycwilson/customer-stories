import { Controller } from '@hotwired/stimulus';
import type ModalController from './modal_controller';
import Cookies from 'js-cookie';
import { type FrameElement } from '@hotwired/turbo';
import { debounce } from '../utils';

export default class CompanySettingsController extends Controller {
  static outlets = ['modal'];
  declare modalOutlet: ModalController;

  static targets = [
    'tab', 
    'invitationTemplateSelect',
    'invitationTemplateTurboFrame',
    'invitationTemplateForm'
  ];
  declare tabTargets: HTMLAnchorElement[];
  // declare invitationTemplateSelectTargets: TomSelectInput[];
  declare invitationTemplateSelectTarget: TomSelectInput;
  // declare invitationTemplateTurboFrameTargets: FrameElement[];
  declare invitationTemplateTurboFrameTarget: FrameElement;
  // declare invitationTemplateFormTargets: HTMLFormElement[];
  declare invitationTemplateFormTarget: HTMLFormElement;

  declare currentScreen: ScreenSize;
  // resizeHandler = debounce(this.onResize.bind(this), 200);

  get activeTab() {
    return <HTMLAnchorElement>this.tabTargets.find(tab => (<HTMLLIElement>tab.parentElement).classList.contains('active'));
  }

  get validTabNames() {
    return this.tabTargets.map(tab => tab.hash.replace('-panel', ''));
  }

  connect() {
    this.initSidebar();
    // window.addEventListener('resize', this.resizeHandler);
  }

  disconnect() {
    // window.removeEventListener('resize', this.resizeHandler);
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

  onChangeInvitationTemplate({ target: select }: { target: TomSelectInput }) {
    const templateId = +select.value || null;
    const isNewTemplate = isNaN(+select.value);
    const action = isNewTemplate ? 'new' : (templateId ? 'edit' : null);
    // const screen = select.id.match(/(?<screen>(sm|md-lg)$)/)?.groups?.screen;
    // const turboFrame = (
    //   this.invitationTemplateTurboFrameTargets.find(frame => frame.classList.contains(screen))
    // ) as FrameElement;
    const turboFrame = this.invitationTemplateTurboFrameTarget;
    let path = action ? turboFrame.dataset[`${action}TemplatePath`] : null;
    select.tomselect.control_input.blur();
    if (isNewTemplate) {
      path += `?template_name=${encodeURIComponent(select.value)}`;
    } else if (templateId) {
      path = (path as string).replace(':id', templateId.toString());
    } else {
      turboFrame.innerHTML = '';
    }
    // turboFrame.setAttribute('id', action ? `${action}-invitation-template-${screen}` : '');
    turboFrame.setAttribute('id', action ? `${action}-invitation-template` : '');
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
    // const screen = turboFrame.id.match(/(?<screen>(sm|md-lg)$)/)?.groups?.screen;
    // const select = this.invitationTemplateSelectTargets.find(select => select.id.includes(screen));
    const select = this.invitationTemplateSelectTarget;
    const toolbar = select.parentElement;
    if (isNewTemplate) {
      select.tomselect.control_input.previousElementSibling.textContent = '\u2013 New Template \u2013';
    }
    toolbar.querySelector('.invitation-template__restore')!.classList.toggle('hidden', !isDefaultTemplate);
    toolbar.querySelector('.invitation-template__delete')!.classList.toggle('hidden', isDefaultTemplate);
    toolbar.querySelector('.btn-group').classList.toggle('hidden', isNewTemplate);
  }

  get visibleInvitationTemplateSelect() {
    // return this.invitationTemplateSelectTargets.find(select => select.checkVisibility());
    return this.invitationTemplateSelectTarget;
  }

  // onResize() {
  //   const newSelect = this.visibleInvitationTemplateSelect;
  //   const newScreen = newSelect?.id.match(/(?<screen>(sm|md-lg)$)/)?.groups?.screen || 'xs';
  //   if (newScreen === this.currentScreen || newScreen === 'xs' || this.currentScreen === 'xs') {
  //     this.currentScreen = newScreen;
  //     return;
  //   }
  //   const oldSelect = this.invitationTemplateSelectTargets.find(select => select !== newSelect);
  //   const newFrame = <FrameElement>this.invitationTemplateTurboFrameTargets.find(frame => frame.classList.contains(newScreen));
  //   const oldFrame = <FrameElement>this.invitationTemplateTurboFrameTargets.find(frame => frame !== newFrame);
  //   const copyFields = () => {
  //     const newName = <HTMLInputElement>newFrame.querySelector(`input[class*="${newScreen}"][name*="name"]`);
  //     const oldName = <HTMLInputElement>oldFrame.querySelector(`input[class*="${this.currentScreen}"][name*="name"]`);
  //     newName.value = oldName.value;
  //     const newSubject = <HTMLInputElement>newFrame.querySelector(`input[class*="${newScreen}"][name*="subject"]`);
  //     const oldSubject = <HTMLInputElement>oldFrame.querySelector(`input[class*="${this.currentScreen}"][name*="subject"]`);
  //     newSubject.value = oldSubject.value;
  //   };
  //   const copyCode = () => {
  //     const newNote = <HTMLElement>newFrame.querySelector(`.invitation-template__summernote--${newScreen}`);
  //     const oldNote = <HTMLElement>oldFrame.querySelector(`.invitation-template__summernote--${this.currentScreen}`);
  //     $(newNote).summernote('code', $(oldNote).summernote('code'));
  //   };
  //   const copyForm = () => { copyFields(); copyCode(); };
  //   if (oldSelect.value) {
  //     if (newSelect.value !== oldSelect.value) {
  //       newFrame.addEventListener('turbo:frame-load', copyForm, { once: true });
  //       newSelect.tomselect.setValue(oldSelect.value);
  //     } else {
  //       copyForm();
  //     }
  //   }
  //   this.currentScreen = newScreen;
  // } 
}