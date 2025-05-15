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

  static targets = [    
    'customerSelect',
    'customerField',
    'customerName',
    'customerWinSelect',
    'successField',
    'successName', 
    'storyTitle',
    'contributorSelect', 
    'contributorFields',
    'contributorField',
    'referrerSelect',
    'referrerFields',
    'referrerField',
    'customerContactBoolField',
    'submitBtn'
  ];

  // all forms share these fields
  declare readonly customerSelectTarget: TomSelectInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly successFieldTargets: HTMLInputElement[];
  declare readonly successNameTarget: HTMLInputElement;
  declare readonly submitBtnTarget: HTMLInputElement | HTMLButtonElement;
  

  declare readonly hasCustomerSelectTarget: boolean;
  declare readonly hasCustomerWinSelectTarget: boolean;
  declare readonly hasContributorSelectTarget: boolean;
  declare readonly hasReferrerSelectTarget: boolean;

  declare initialState: string;

  get isDirty() {
    return serializeForm(this.element) !== this.initialState;
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

  updateValidator({ type: eventType, detail: { fileInput } }: { type: string, detail: { fileInput: HTMLInputElement } }) {
    console.log('updating validator', eventType)
    fileInput.setAttribute('data-validate', eventType === 'image-card:ready-to-validate' ? 'true' : 'false');
    $(this.element).validator('update');
    if (eventType === 'image-card:ready-to-validate') {
      $(this.element).validator('validate');
    }
  }

  onChangeContact(
    this: NewCustomerWinController | NewContributionController, 
    { target: select }: { target: TomSelectInput }
  ) {
    const contactType = select.dataset.tomselectKindValue as Extract<SelectInputKind, 'contributor' | 'referrer'>;
    const isNewContact = select.value === '0';
    const isExistingContact = select.value && !isNewContact;

    // enable/disable submission via the [name] attribute => precludes ui changes
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

  onChangeCustomer(this: Ctrl, { target: select }: { target: TomSelectInput }) {
    const isNewCustomer = isNaN(+select.value);
    const customerId = +select.value || null;
    const updateCustomerWinSelect = function (this: NewContributionController | NewStoryController) {
      this.customerWinSelectTarget.tomselect.clear(true);
      if (customerId) {
        this.setCustomerWinIds();
      } else {
        this.customerWinsWereFiltered = false;
      }
    }

    // enable/disable submission via the [name] attribute => precludes ui changes
    if (!select.dataset.fieldName) throw new Error('Missing data-field-name attribute');
    select.setAttribute('name', isNewCustomer ? '' : select.dataset.fieldName);

    // enable/disable hidden customer fields
    this.customerFieldTargets.forEach((field: HTMLInputElement) => field.disabled = !isNewCustomer);
    this.customerNameTarget.value = isNewCustomer ? select.value.trim() : '';

    if (this.hasCustomerWinSelectTarget) {
      updateCustomerWinSelect.bind(this as NewContributionController | NewStoryController)();
    } 
  }

  onChangeCustomerWin(this: Ctrl, { target: select }: { target: TomSelectInput }) {
    const isNewCustomerWin = isNaN(+select.value);
    const winId = +select.value || null;

    // enable/disable submission via the [name] attribute => precludes ui changes
    if (!select.dataset.fieldName) throw new Error('Missing data-field-name attribute');
    select.setAttribute('name', isNewCustomerWin ? '' : select.dataset.fieldName);

    // enable/disable hidden customer win fields
    this.successFieldTargets.forEach((field: HTMLInputElement) => field.disabled = !isNewCustomerWin);
    this.successNameTarget.value = isNewCustomerWin ? select.value.trim() : '';

    // Type checking will fail unless the `this` param is annotated for these functions
    // => note that the function must be bound to the surrounding functions `this` when called (see below)
    const updateContributorOptions = function (this: NewCustomerWinController | NewContributionController, winId: number) {
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
    const resetContributorOptions = function (this: NewCustomerWinController | NewContributionController) {
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

      // disable contributor option for any contributors that already have a contribution for this customer win
      if (this.hasContributorSelectTarget) {
        updateContributorOptions.bind(this as NewCustomerWinController | NewContributionController)(winId);
      }
    } else if (this.hasContributorSelectTarget) {
      resetContributorOptions.bind(this as NewCustomerWinController | NewContributionController)();
    }
  }

  setCustomerWinIds(this: NewContributionController | NewStoryController) {
    const customerId = +this.customerSelectTarget.value;
    
    // CSP['customerWins'] may be undefined in the case of new story from Curate
    if (CSP['customerWins']) {
      this.customerCustomerWinIds = CSP['customerWins']
        .filter((win: CustomerWin) => win.customer.id === customerId)
        .map((win: CustomerWin) => win.id);
    } else {
      this.customerCustomerWinIds = Object.entries(this.customerWinSelectTarget.tomselect.options as TomOptions)
        .filter(([id, option]) => +(option as { customerId: string }).customerId === customerId)
        .map(([id, option]) => +id);
    }
    this.customerWinsWereFiltered = false;
  }

  filterCustomerWinOptions(this: NewContributionController | NewStoryController) {
    if (this.customerWinsWereFiltered || !this.customerCustomerWinIds) return;
    const hasExistingCustomer = +this.customerSelectTarget.value;
    const hasNewCustomer = isNaN(+this.customerSelectTarget.value);
    for (const [id, option] of Object.entries(this.customerWinSelectTarget.tomselect.options as TomOptions)) {
      option.$div.classList.toggle(
        'hidden', 
        hasNewCustomer || (hasExistingCustomer && !this.customerCustomerWinIds.includes(+option.value))
      );
    }
    this.customerWinsWereFiltered = true;
  }

  // for newly created contacts, autofill the password with the email
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