import { Controller } from '@hotwired/stimulus';
import type NewCustomerWinController from './new_customer_win_controller';
import type NewContributionController from './new_contribution_controller';
import type NewStoryController from './new_story_controller';
import type { TomInput, TomOption } from 'tom-select/dist/types/types';

export default class FormController extends Controller<HTMLFormElement> {
  [key: string]: any;

  static targets = [    
    'referrerFields',
    'referrerField',
    'contributorFields',
    'contributorField',
    'requiredField',
  ];
  declare readonly referrerFieldsTarget: HTMLDivElement;
  declare readonly referrerFieldTargets: HTMLInputElement[];
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly contributorFieldTargets: HTMLInputElement[];
  declare readonly requiredFieldTargets: [TomInput | HTMLInputElement];

  connect() {
    // console.log('connect form', this.element.id)
    this.removeErrorsOnValidInput();
    this.autofillNewContactPasswords();
  }

  get hasNewCustomer() {
    if (!this.hasCustomerSelectTarget) return;    // method is inherited by child controllers
    return isNaN(+this.customerSelectTarget.value);
  }

  get hasExistingCustomer() {
    if (!this.hasCustomerSelectTarget) return;
    return this.customerSelectTarget.value && !this.hasNewCustomer; 
  }

  beforeSendXHR(e: CustomEvent) {
    if (!this.isValid()) {
      e.preventDefault();
    }
  }
  
  isValid() {
    let isValid = true;
    // the hidden text fields are enabled/disabled via the disabled property,
    // whereas the select inputs are enabled/disabled by toggling the [name] attribute (precludes ui changes)
    this.requiredFieldTargets
      .filter(field => !(field.disabled || (field as HTMLSelectElement).name === ''))
      .forEach(field => {
        const formGroup = field.closest('.form-group') as HTMLDivElement;
        if (!field.value.trim()) {
          formGroup.classList.add('has-error');
          isValid = false;
        }
      });
    if (!this.element.classList.contains('was-validated')) this.element.classList.add('was-validated');
    return isValid;
  }

  removeErrorsOnValidInput() {
    const removeError = (e: Event) => {
      const field = e.target as TomInput | HTMLInputElement;
      if (field.value.trim()) {
        (field.closest('.form-group') as HTMLDivElement).classList.remove('has-error');
      }
    }
    this.requiredFieldTargets.forEach(field => {
      field.addEventListener(field instanceof HTMLSelectElement ? 'change' : 'input', removeError);
    })
  }

  onChangeContact({ target: select }: { target: TomInput }) {
    const contactType = select.dataset.tomselectTypeValue as Extract<SelectInputType, 'contributor' | 'referrer'>;
    const isNewContact = select.value === '0';
    const isExistingContact = select.value && !isNewContact;

    // enable/disable submission via the [name] attribute => precludes ui changes
    select.setAttribute('name', select.value && !isNewContact ? select.dataset.fieldName as string : '');
    (this[`${contactType}FieldTargets`] as HTMLInputElement[]).forEach(input => {
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

  handleCustomerChange(this: NewCustomerWinController | NewContributionController | NewStoryController) {
    const select = this.customerSelectTarget;
    const isNewCustomer = isNaN(+select.value);
    const customerId = +select.value || null;

    // enable/disable submission via the [name] attribute => precludes ui changes
    if (!select.dataset.fieldName) throw('Missing data-field-name attribute');
    select.setAttribute('name', isNewCustomer ? '' : select.dataset.fieldName);
    this.customerFieldTargets.forEach((field: HTMLInputElement) => field.disabled = !isNewCustomer);
    this.customerNameTarget.value = isNewCustomer ? select.value.trim() : '';
    if (this.hasCustomerWinSelectTarget) {
      this.customerWinSelectTarget.tomselect!.clear(true);
      if (customerId) {
        (this as NewContributionController | NewStoryController).setCustomerWinIds();
      } else {
        this.customerWinsWereFiltered = false;
      }
    }
  }

  setCustomerWinOptions(this: NewContributionController | NewStoryController) {
    if (!this.hasExistingCustomer || !this.hasCustomerWinSelectTarget) return;
    const customerId = +this.customerSelectTarget.value;
    
    // the New Story form won't have access to the customer wins table (customerWinsCtrl)
    try {
      this.customerCustomerWinIds = this.customerWinsCtrl.dt.data().toArray()
        .filter((customerWin: CustomerWin) => customerWin.customer.id === customerId)
        .map((customerWin: CustomerWin) => customerWin.id);
    } catch {
      this.customerCustomerWinIds = Object.entries(this.customerWinSelectTarget.tomselect!.options)
        .filter(([id, option]: [string, any]) => +(option as { customerId: string }).customerId === customerId)
        .map(([id, option]: [string, any]) => +id);
    }
    this.customerWinsWereFiltered = false;
  }

  shouldFilterCustomerWinOptionsOnConnect(this: NewContributionController | NewStoryController) {
    return (
      this.hasExistingCustomer && 
      this.hasCustomerWinSelectTarget && 
      !this.customerWinSelectTarget.classList.contains('readonly')
    );
  }

  filterCustomerWins(this: NewContributionController | NewStoryController) {
    if (this.customerWinsWereFiltered) return;
    Object.entries(this.customerWinSelectTarget.tomselect!.options).forEach(([id, option]: [string, TomOption]) => {
      option.$div.classList.toggle(
        'hidden', 
        this.hasNewCustomer || (this.hasExistingCustomer && !this.customerCustomerWinIds.includes(+option.value))
      );
    })
    this.customerWinsWereFiltered = true;
  }

  // for newly created contacts, autofill the password with the email
  autofillNewContactPasswords() {
    const referrerEmail = <HTMLInputElement>this.referrerFieldTargets.find(input => input.name.includes('email'));
    const referrerPassword = <HTMLInputElement>this.referrerFieldTargets.find(input => input.name.includes('password'));
    const contributorEmail = <HTMLInputElement>this.contributorFieldTargets.find(input => input.name.includes('email'));
    const contributorPassword = <HTMLInputElement>this.contributorFieldTargets.find(input => input.name.includes('password'));
    if (!referrerEmail || !referrerPassword || !contributorEmail || !contributorPassword) return;
    [[referrerEmail, referrerPassword], [contributorEmail, contributorPassword]].forEach(([emailInput, passwordInput]) => {
      emailInput.addEventListener('input', (e) => {
        const email = (e.currentTarget as HTMLInputElement).value;
        passwordInput.value = email;
      });
    });
  }
}