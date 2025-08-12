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
    if (this.element.tagName !== 'FORM') return;  // initial view
    super.connect();
    if (this.isNewTemplate) this.nameFieldTarget.focus();
  }

  // disconnect() {
  // }

  async onChangeTemplate({ target: select }: { target: TomSelectInput }) {
    if (!select.value) return;
    const request = new FetchRequest('get', select.options[select.selectedIndex].dataset.path, { 
      headers: { Accept: 'text/vnd.turbo-stream.html' } 
    });
    const response = await request.perform();
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

  // Set initial state here instead of in connect(), since the initial view is not a form element
  onInitTemplateBody({ detail: components }: { detail: SummernoteComponents }) {
    this.initialState = serializeForm(this.element);
  } 

  updateState(e: InputEvent | CustomEvent) {
    // Summernote will emit both 'input' and 'change' events; ignore the former.
    // The change event is needed because 'input' event is not always emitted, e.g. adding a newline
    if (e.type === 'input' && (e.target as HTMLElement).tagName !== 'INPUT') return;

    // Allow summernote to update the textarea before inspecting the form data
    setTimeout(super.updateState.bind(this, e));
  }
}