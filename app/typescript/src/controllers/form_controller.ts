import { Controller } from '@hotwired/stimulus';
import type { TurboSubmitStartEvent, TurboSubmitEndEvent } from '@hotwired/turbo';
import type { ModalController } from '.';
import { 
  sharedTargets,
  validateForm,
  serializeForm,
  handleChangeCustomer as onChangeCustomer,
  handleChangeCustomerWin as onChangeCustomerWin,
  handleChangeContact as onChangeContact,
  filterCustomerWinOptions as onCustomerWinsDropdownDidOpen
 } from '../utils';

export default class FormController<_Ctrl> extends Controller<HTMLFormElement> {
  static outlets = ['modal'];
  static targets = sharedTargets;

  declare readonly hasCustomerWinSelectTarget: boolean;
  declare readonly hasSuccessPlaceholderTarget: boolean;
  declare readonly hasContributorSelectTarget: boolean;
  protected declare readonly modalOutlet: ModalController;
  protected declare readonly hasModalOutlet: boolean;
  protected declare readonly imageCardTargets: HTMLElement[];
  protected declare readonly submitBtnTarget: HTMLInputElement | HTMLButtonElement;
  protected handleChangeCustomer = onChangeCustomer;
  protected handleChangeCustomerWin = onChangeCustomerWin;
  protected handleChangeContact = onChangeContact;
  protected filterCustomerWinOptions = onCustomerWinsDropdownDidOpen
  protected declare initialState: string;
  private declare readonly hasSubmitBtnTarget: boolean;
  private declare readonly submitTargets: (HTMLInputElement | HTMLButtonElement)[];

  get isDirty() {
    return serializeForm(this.element) !== this.initialState;
  }

  get submitBtn(): HTMLInputElement | HTMLButtonElement | undefined {
    if (this.hasSubmitBtnTarget) {
      return this.submitBtnTarget;
    } else if (document.getElementById('main-modal')?.contains(this.element)) {
      // Forms in modals have a submit button that is outside the form's render tree,
      // can be identified by the `form=` attribute
      return (
        document.getElementById('main-modal')?.querySelector(`[form="${this.element.id}"]`)
      ) as HTMLButtonElement;
    } else {
      console.error('FormController: No submit button found');
    }
  }

  connect() {
    this.initialState = serializeForm(this.element);
  }

  turboSubmit(e: CustomEvent<{ submitter?: HTMLButtonElement | HTMLInputElement }>) {
    const { submitter } = e.detail;
    if (submitter && submitter.type === 'button') submitter.type = 'submit';
    this.element.requestSubmit(submitter);
  }

  handleSubmitStart(e: TurboSubmitStartEvent) {
    // console.log('start', e)
    const { formSubmission } = e.detail;
    const { submitter } = formSubmission;
    
    // this.submitTargets
    //   // The submitter will disable itself, no need to disable it twice
    //   .filter(submitEl => submitEl !== submitter)
    //   .forEach(submitEl => submitEl.disabled = true);
    // console.log('submitter:', submitter)
    this.animateSubmit(e, submitter);
  }

  handleSubmitEnd(e: TurboSubmitEndEvent) {
    if (e.detail.success && this.hasModalOutlet) {
      this.modalOutlet.hide()
    }
  }

  validate(e: SubmitEvent): boolean {
    return validateForm(e);
  }

  updateState(_e?: Event) {
    this.element.classList.toggle('is-dirty', this.isDirty);
    if (this.submitBtn) {
      this.submitBtn.classList.toggle('disabled', !this.isDirty);
      this.submitBtn.disabled = !this.isDirty;
    }
  }

  animateSubmit(e: TurboSubmitStartEvent, submitEl?: HTMLButtonElement | HTMLInputElement) {
    const submitBtn = submitEl || this.submitBtn;
    if (!submitBtn?.dataset.content || !submitBtn?.dataset.disableWithHtml) return;

    submitBtn.classList.add('submitting');
    submitBtn.innerHTML = 
      submitBtn.dataset.disableWithHtml.replace('[content]', submitBtn.dataset.content);  
    setTimeout(() => submitBtn.classList.add('btn--working'), 1000);
  }

  // Method is for the customer form only (which does not have its own controller)
  toggleShowName({ currentTarget: formGroup }: { currentTarget: HTMLElement }) {
    formGroup.classList.toggle('customer__logo--with-name');
  }
}