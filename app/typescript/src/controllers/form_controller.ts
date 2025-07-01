import { Controller } from '@hotwired/stimulus';
import type ModalController from './modal_controller';
import type NewCustomerWinController from './new_customer_win_controller';
import type NewContributionController from './new_contribution_controller';
import type NewStoryController from './new_story_controller';
import type UserProfileController from './user_profile_controller';
import type CompanyProfileController from './company_profile_controller';
import type InvitationTemplateController from './invitation_template_controller';
import type ContributorInvitationController from './contributor_invitation_controller';
import type CompanyTagsController from './company_tags_controller';
import type CtaController from './cta_controller';
import type AdsController from './ads_controller';
import type { TomOptions } from 'tom-select/dist/types/types';
import { validateForm, serializeForm } from '../utils';
import { validateFileSize, validateImageDimensions } from '../user_uploads';

export type SubclassController = (
  NewCustomerWinController | 
  NewContributionController | 
  NewStoryController |
  UserProfileController |
  CompanyProfileController |
  InvitationTemplateController |
  ContributorInvitationController |
  CompanyTagsController |
  CtaController |
  AdsController
);

export default class FormController<Ctrl extends SubclassController> extends Controller<HTMLFormElement> {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;
  declare readonly hasModalOutlet: boolean;

  static targets = [    
    'customerSelect',
    'customerField',
    'customerName',
    'customerWinSelect',
    'successField',
    'successName', 
    'contributorSelect', 
    'contributorFields',
    'contributorField',
    'referrerSelect',
    'referrerFields',
    'referrerField',
    'curatorSelect',
    'customerContactBoolField',
    'submitBtn'
  ];

  // shared fields
  declare readonly customerSelectTarget: TomSelectInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;

  declare readonly customerWinSelectTarget: TomSelectInput;
  declare readonly successFieldTargets: HTMLInputElement[];
  declare readonly successNameTarget: HTMLInputElement;
  declare readonly successPlaceholderTarget: HTMLInputElement;

  declare readonly submitBtnTarget: HTMLInputElement | HTMLButtonElement;
  declare readonly hasSubmitBtnTarget: boolean;

  declare readonly hasCustomerSelectTarget: boolean;
  declare readonly hasCustomerWinSelectTarget: boolean;
  declare readonly hasContributorSelectTarget: boolean;
  declare readonly hasReferrerSelectTarget: boolean;
  declare readonly hasSuccessFieldTargets: boolean;
  declare readonly hasSuccessPlaceholderTarget: boolean;
  declare readonly hasCuratorSelectTarget: boolean;

  declare initialState: string;

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

    // validator will only run for file inputs (app/typescript/src/bootstrap.ts)
    $(this.element).validator({
      focus: false,
      disable: false,
      custom: {
        'max-file-size': validateFileSize.bind(this),
        'min-dimensions': validateImageDimensions.bind(this),
        'required-image': function ($fileInput: JQuery<HTMLInputElement, any>) {
          console.log('checking for required image (skipping)...', $fileInput)
        }
      }
    });
  }

  disconnect() {
    $(this.element).validator('destroy');
  }

  validate(e: SubmitEvent): boolean {
    return validateForm(e);
  }

  // onAjaxComplete(this: Ctrl, { detail: [xhr, status] }: { detail: [xhr: XMLHttpRequest, status: string] }) {
    // console.log('superclass', xhr, status)
  // }

  updateValidator(this: Ctrl, { type: eventType, detail: { fileInput } }: { type: string, detail: { fileInput: HTMLInputElement } }) {
    console.log('updating validator', eventType)
    fileInput.setAttribute('data-validate', eventType === 'image-card:ready-to-validate' ? 'true' : 'false');
    $(this.element).validator('update');
    if (eventType === 'image-card:ready-to-validate') {
      $(this.element).validator('validate');
    }
  }

  animateSubmitBtn(e: SubmitEvent) {
    // console.log('animate')
    const submitBtn = this.submitBtn;
    if (!submitBtn?.dataset.content || !submitBtn?.dataset.disableWithHtml) return;
    const submitBtnText = submitBtn.dataset.content;
    const submitBtnDisableWith = document.createElement('div');
    submitBtnDisableWith.innerHTML = submitBtn.dataset.disableWithHtml;
    const contentEl = <HTMLElement>submitBtnDisableWith.querySelector(':scope > .btn__content');
    contentEl.textContent = submitBtnText;
    submitBtn.innerHTML = submitBtnDisableWith.innerHTML;
    setTimeout(() => submitBtn.classList.add('btn--working'), 1000);
  }

  onChangeCustomer(
    this: NewCustomerWinController | NewContributionController | NewStoryController, 
    { target: select }: { target: TomSelectInput }
  ) {
    const isNew = isNaN(+select.value);
    const customerId = +select.value || null;

    // Enable/disable select elements via the [name] attribute => precludes ui changes
    select.setAttribute('name', isNew ? '' : select.dataset.fieldName);

    // hidden fields for a new customer
    this.customerFieldTargets.forEach((field: HTMLInputElement) => field.disabled = !isNew);
    this.customerNameTarget.value = isNew ? select.value.trim() : '';

    // reset customer win select options
    if (this.hasCustomerWinSelectTarget) {
      this.customerWinSelectTarget.tomselect.clear(true);
    } 
  }

  onChangeCustomerWin(
    this: NewContributionController | NewStoryController,
    { target: select }: { target: TomSelectInput }
  ) {
    const isNew = isNaN(+select.value);
    const winId = +select.value || null;
    const wasCleared = !(isNew || winId);
    const updateCuratorSelect = function (this: NewStoryController) {
      this.curatorSelectTarget.setAttribute('name', isNew || wasCleared ? this.curatorSelectTarget.dataset.fieldName : '');
    };

    // Enable/disable select elements via the [name] attribute => precludes ui changes
    select.setAttribute('name', isNew || wasCleared ? '' : select.dataset.fieldName);
    if (this.hasCuratorSelectTarget) {
      updateCuratorSelect.bind(this as NewStoryController)();
    }

    // Hidden fields for a new customer win
    // For a new story, `placeholder: true` and `name: nil` for the associated success if none was specified
    // TODO successName and successPlaceholder needn't be targets -- just look for the name
    this.successFieldTargets.forEach((field: HTMLInputElement) => {
      if (field === this.successNameTarget) {
        field.disabled = !isNew;
        field.value = isNew ? select.value.trim() : '';
      } else if (field === this.successPlaceholderTarget) {
        field.checked = wasCleared;
        field.disabled = !!winId || isNew;
      } else {
        field.disabled = !!winId
      }
    });

    const updateContributorOptions = function (this: NewContributionController, winId: number) {
      const tsOptions = this.contributorSelectTarget.tomselect.options as TomOptions;

      // new story form can't presently have a contributor select, because it may not have access to the contributions data
      if (!CSP['contributions']) throw new Error('updateContributorOptions should only be called from Prospect section');
      const winContributorIds: number[] = CSP['contributions']
        .filter((contribution: Contribution) => contribution.success!.id === winId)
        .map((contribution: Contribution) => contribution.contributor!.id);
      winContributorIds.forEach(contributorId => {
        const newOptionSettings = { value: contributorId, text: tsOptions[contributorId].text, disabled: true  };
        this.contributorSelectTarget.tomselect.updateOption(contributorId.toString(), newOptionSettings);
      });
    }
    const resetContributorOptions = function (this: NewContributionController) {
      const tsOptions = this.contributorSelectTarget.tomselect.options as TomOptions;
      Object.entries(tsOptions).forEach(([value, option]) => {
        if (option.disabled) {
          this.contributorSelectTarget.tomselect.updateOption(value, { value, text: option.text, disabled: false });
        }
      });
    }

    if (winId) {
      // set the customer select to the customer associated with the selected customer win
      let customerId;
      if (CSP['customerWins']) {
        const win = CSP['customerWins'].find((win: CustomerWin) => win.id === winId) as CustomerWin;
        customerId = win.customer.id;
      } else {
        const option = select.tomselect.options[winId];
        customerId = +(option as { customerId: string }).customerId;
      }
      this.customerSelectTarget.tomselect.setValue(customerId, true);

      // Disable contributor option for any contributors that already have a contribution for this customer win
      if (this.hasContributorSelectTarget) {
        updateContributorOptions.bind(this as NewContributionController)(winId);
      }
    } else if (this.hasContributorSelectTarget) {
      resetContributorOptions.bind(this as NewContributionController)();
    }
  }

  onChangeContact(
    this: NewCustomerWinController | NewContributionController, 
    { target: select }: { target: TomSelectInput }
  ) {
    const contactType = select.dataset.tomselectKindValue as Extract<SelectInputKind, 'contributor' | 'referrer'>;
    const isNewContact = select.value === '0';
    const isExistingContact = select.value && !isNewContact;

    // Enable/disable select elements via the [name] attribute => precludes ui changes
    select.setAttribute('name', select.value && !isNewContact ? select.dataset.fieldName as string : '');
    this[`${contactType}FieldTargets`].forEach(input => {
      input.value = /success_contact|sign_up_code/.test(input.name) ? input.value : '';
      input.disabled = input.name.includes('success_contact') ? (!isExistingContact && !isNewContact) : !isNewContact;
      input.required = isNewContact && input.type !== 'hidden';
    });
    if (isNewContact) {
      this[`${contactType}FieldsTarget`].classList.remove('hidden');
      const firstName = this[`${contactType}FieldTargets`].find((input: HTMLInputElement) => input.name.includes('first'));
      firstName?.focus();
    } else {
      this[`${contactType}FieldsTarget`].classList.add('hidden');
    }
  }

  filterCustomerWinOptions(this: NewContributionController | NewStoryController) {
    const isNewCustomer = isNaN(+this.customerSelectTarget.value);
    const customerId = +this.customerSelectTarget.value || null;
    for (const [id, option] of Object.entries(this.customerWinSelectTarget.tomselect.options as TomOptions)) {
      option.$div.classList.toggle('hidden', isNewCustomer || (customerId && customerId !== +option.customerId));
    }
  }

  // For newly created contacts, autofill the password with the email
  autofillNewContactPasswords(this: NewCustomerWinController | NewContributionController) {
    if (!this.contributorFieldTargets || !this.referrerFieldTargets) return;
    const referrerEmail = <HTMLInputElement>this.referrerFieldTargets.find(input => input.name.includes('email'));
    const referrerPassword = <HTMLInputElement>this.referrerFieldTargets.find(input => input.name.includes('password'));
    const contributorEmail = <HTMLInputElement>this.contributorFieldTargets.find(input => input.name.includes('email'));
    const contributorPassword = <HTMLInputElement>this.contributorFieldTargets.find(input => input.name.includes('password'));
    if (!referrerEmail || !referrerPassword || !contributorEmail || !contributorPassword) {
      throw new Error('Missing email or password inputs') 
    } else {
      [[referrerEmail, referrerPassword], [contributorEmail, contributorPassword]].forEach(([emailInput, passwordInput]) => {
        emailInput.addEventListener('input', (e) => {
          const email = (e.currentTarget as HTMLInputElement).value;
          passwordInput.value = email;
        });
      });
    }
  }
}