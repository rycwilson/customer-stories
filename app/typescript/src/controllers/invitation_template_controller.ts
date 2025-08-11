import FormController from './form_controller';
import type { SummernoteComponents } from '../summernote';
import { serializeForm } from '../utils';
import { FetchRequest } from '@rails/request.js';

export default class InvitationTemplateController extends FormController<InvitationTemplateController> {
  static targets = ['templateSelect', 'nameField', 'btnGroup', 'submitBtn', 'newTemplateBtn', 'formFields'];
  declare readonly templateSelectTarget: TomSelectInput;
  declare readonly nameFieldTarget: HTMLInputElement;
  declare readonly btnGroupTarget: HTMLDivElement;
  declare readonly submitBtnTarget: HTMLButtonElement;
  declare readonly newTemplateBtnTarget: HTMLButtonElement;
  declare readonly formFieldsTarget: HTMLDivElement;

  get isNewTemplate() {
    return this.templateSelectTarget.value === '';
  }

  connect() {
    super.connect();
    if (this.element.tagName !== 'FORM') return;
    if (this.isNewTemplate) this.nameFieldTarget.focus();
  }

  // disconnect() {
  // }

  onChangeTemplate({ target: select }: { target: TomSelectInput }) {
    if (!select.value) return;
    const path = select.options[select.selectedIndex].dataset.path;
    if (!path) {
      console.error('No path found for the selected template');
      return;
    }
    this.getTemplate(path)
  }
  
  async getTemplate(path: string) {
    const request = new FetchRequest('get', path, { 
      headers: { Accept: 'text/vnd.turbo-stream.html' } 
    });
    await request.perform();
    // const response = await request.perform();
    // if (response.ok) {}
  }

  restore() {

  }

  duplicate() {
    const templateId = this.element.action.match(/(?<id>\d+)$/)?.groups?.id;
    if (!templateId || isNaN(+templateId)) {
      console.error('Invalid template ID for duplication');
      return;
    }
  }

  delete() {

  }

  discard() {
    // The tomselect input must be reset in order to change the placeholder
    this.templateSelectTarget.setAttribute('placeholder', 'Select template');
    this.templateSelectTarget.setAttribute('data-tomselect-reset-value', 'true');
    setTimeout(() => this.templateSelectTarget.setAttribute('data-tomselect-reset-value', 'false'));
    this.onClearTemplateSelect();
  }

  onClearTemplateSelect() {
    this.templateSelectTarget.tomselect.wrapper.querySelector('.clear-button')?.remove();
    [this.btnGroupTarget, this.submitBtnTarget, this.formFieldsTarget].forEach(el => el.remove());
    this.newTemplateBtnTarget.classList.remove('hidden');
  }

  onInitTemplateBody({ detail: { components } }: { detail: { components: SummernoteComponents } }) {
    console.log('invitation template body initialized', components);
    // 1 - update the hidden field
    // 2 - set initial state
    this.initialState = serializeForm(this.element);
  } 
}