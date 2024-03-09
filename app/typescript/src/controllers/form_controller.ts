import { Controller } from '@hotwired/stimulus';
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
    this.requiredFieldTargets.filter(field => !field.disabled).forEach(field => {
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

  setCustomerFields(customerSelectValue: string) {
    try {
      const customerId = isNaN(+customerSelectValue) ? null : +customerSelectValue;
      this.customerSelectTarget.disabled = !customerId;
      this.customerFieldTargets.forEach((field: HTMLInputElement) => field.disabled = !!customerId);
      this.customerNameTarget.value = !customerId ? customerSelectValue : '';
      return customerId;
    } catch {
      throw("Method can only be called from subclasses of FormController");
    }
  }

  setCustomerWinFields(customerId: number | null) {
    try {
      this.successCustomerIdTarget.value = customerId?.toString() || '';
      this.successCustomerIdTarget.disabled = !!customerId;
      this.customerWinSelectTarget.tomselect!.clear(true);
    } catch {
      throw("Method can only be called from subclasses of FormController");
    }
  }

  setCustomerWinOptions() {
    try {
      if (!this.hasExistingCustomer) return;
      const customerId = +this.customerSelectTarget.value;
      this.customerCustomerWinIds = this.customerWinsCtrl.dt.data().toArray()
        .filter((customerWin: CustomerWin) => customerWin.customer.id === customerId)
        .map((customerWin: CustomerWin) => customerWin.id);
      this.customerWinsWereFiltered = false;
    } catch {
      throw("Method can only be called from subclasses of FormController");
    }
  }

  filterCustomerWins(e: Event) {
    try {
      if (this.customerWinsWereFiltered) return false;
      Object.keys(this.customerWinSelectTarget.tomselect!.options).forEach(customerWinId => {
        const tsOption = this.customerWinSelectTarget.tomselect!.getOption(customerWinId) as TomOption;
        const shouldHide = (
          this.hasNewCustomer || 
          (this.hasExistingCustomer && !this.customerCustomerWinIds.includes(+customerWinId))
        );
        tsOption.classList.toggle('hidden', shouldHide);
      });
      this.customerWinsWereFiltered = true;
    } catch {
      throw("Method can only be called from subclasses of FormController");
    }
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