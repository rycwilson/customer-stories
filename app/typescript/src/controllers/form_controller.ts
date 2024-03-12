import { Controller } from '@hotwired/stimulus';
import type NewCustomerWinController from './new_customer_win_controller';
import type NewContributionController from './new_contribution_controller';
import type NewStoryController from './new_story_controller';
import type { TomOptions } from 'tom-select/dist/types/types';

type ConcreteFormController = NewCustomerWinController | NewContributionController | NewStoryController;
type FormWithCustomerWinSelect = NewContributionController | NewStoryController;

export default class FormController<Ctrl extends ConcreteFormController> extends Controller<HTMLFormElement> {
  static outlets = ['resource', 'modal'];

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
    'requiredField',
    'customerContactBoolField'
  ];

  declare readonly referrerFieldsTarget: HTMLDivElement;
  declare readonly referrerFieldTargets: HTMLInputElement[];
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly contributorFieldTargets: HTMLInputElement[];
  declare readonly requiredFieldTargets: (TomSelectInput | HTMLInputElement)[];
  declare readonly hasCustomerWinSelectTarget: boolean;
  declare readonly hasContributorSelectTarget: boolean;

  connect() {
    this.removeErrorsOnValidInput();
    this.autofillNewContactPasswords();
  }

  validate(e: CustomEvent) {
    let isValid = true;

    // the hidden text fields are enabled/disabled via the disabled property,
    // whereas the select inputs are enabled/disabled by toggling the [name] attribute (precludes ui changes)
    this.requiredFieldTargets
      .filter(field => field.name && !field.disabled)
      .forEach(field => {
        if (!field.checkValidity()) {
          field.closest('.form-group').classList.add('has-error');
          isValid = false;
        }
      });
    if (!this.element.classList.contains('was-validated')) this.element.classList.add('was-validated');
    if (!isValid) e.preventDefault();
  }

  removeErrorsOnValidInput() {
    const removeError = (e: Event) => {
      const field = e.target as TomSelectInput | HTMLInputElement;
      if (field.value.trim()) {
        (field.closest('.form-group') as HTMLDivElement).classList.remove('has-error');
      }
    }
    this.requiredFieldTargets.forEach(field => {
      field.addEventListener(field instanceof HTMLSelectElement ? 'change' : 'input', removeError);
    })
  }

  onChangeContact({ target: select }: { target: TomSelectInput }) {
    const contactType = select.dataset.tomselectTypeValue as Extract<SelectInputType, 'contributor' | 'referrer'>;
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

  handleCustomerChange(this: Ctrl) {
    const select = this.customerSelectTarget;
    const isNewCustomer = isNaN(+select.value);
    const customerId = +select.value || null;
    const updateCustomerWinSelect = function (this: FormWithCustomerWinSelect) {
      this.customerWinSelectTarget.tomselect.clear(true);
      if (customerId) {
        this.setCustomerWinIds();
      } else {
        this.customerWinsWereFiltered = false;
      }
    };

    // enable/disable submission via the [name] attribute => precludes ui changes
    if (!select.dataset.fieldName) throw('Missing data-field-name attribute');
    select.setAttribute('name', isNewCustomer ? '' : select.dataset.fieldName);

    // enable/disable hidden customer fields
    this.customerFieldTargets.forEach((field: HTMLInputElement) => field.disabled = !isNewCustomer);
    this.customerNameTarget.value = isNewCustomer ? select.value.trim() : '';

    if (this.hasCustomerWinSelectTarget) {
      updateCustomerWinSelect.bind(this as FormWithCustomerWinSelect)();
    } 
  }

  handleCustomerWinChange(this: FormWithCustomerWinSelect) {
    const select = this.customerWinSelectTarget; 
    const isNewCustomerWin = isNaN(+select.value);
    const winId = +select.value || null;

    // enable/disable submission via the [name] attribute => precludes ui changes
    if (!select.dataset.fieldName) throw('Missing data-field-name attribute');
    select.setAttribute('name', isNewCustomerWin ? '' : select.dataset.fieldName);

    // enable/disable hidden customer win fields
    this.successFieldTargets.forEach((field: HTMLInputElement) => field.disabled = !isNewCustomerWin);
    this.successNameTarget.value = isNewCustomerWin ? select.value.trim() : '';

    // Type checking will fail unless the `this` param is annotated for these functions
    // => note that the function must be bound to the surrounding functions `this` when called (see below)
    const updateContributorOptions: (winId: number) => void = function (this: NewContributionController) {
      const tsOptions = this.contributorSelectTarget.tomselect.options as TomOptions;
      if (!this.contributorsCtrl) throw('Missing contributors resource controller');
      const winContributorIds: number[] = this.contributorsCtrl.dt.data().toArray()
        .filter((contribution: Contribution) => contribution.success!.id === winId)
        .map((contribution: Contribution) => contribution.contributor!.id);
      winContributorIds.forEach(contributorId => {
        const newOptionSettings = { value: contributorId, text: tsOptions[contributorId].text, disabled: true  };
        this.contributorSelectTarget.tomselect.updateOption(contributorId.toString(), newOptionSettings);
      });
    }
    const resetContributorOptions: () => void = function (this: NewContributionController) {
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
      if (this.customerWinsCtrl) {
        const win = this.customerWinsCtrl.dt.data().toArray().find((win: CustomerWin) => win.id === winId);
        customerId = win.customer.id;
      } else {
        const option = select.tomselect.options[winId];
        customerId = +(option as { customerId: string }).customerId;
      }
      this.customerSelectTarget.tomselect.setValue(customerId, true);

      // disable contributor option for any contributors that already have a contribution for this customer win
      if (this.hasContributorSelectTarget) updateContributorOptions.bind(this)(winId);
    } else if (this.hasContributorSelectTarget) {
      resetContributorOptions.bind(this)();
    }
  }

  setCustomerWinIds(this: FormWithCustomerWinSelect) {
    const customerId = +this.customerSelectTarget.value;
    
    // the New Story form may not have access to the customer wins table (customerWinsCtrl)
    if (this.customerWinsCtrl) {
      this.customerCustomerWinIds = this.customerWinsCtrl.dt.data().toArray()
        .filter((win: CustomerWin) => win.customer.id === customerId)
        .map((win: CustomerWin) => win.id);
    } else {
      this.customerCustomerWinIds = Object.entries(this.customerWinSelectTarget.tomselect.options)
        .filter(([id, option]: [string, any]) => +(option as { customerId: string }).customerId === customerId)
        .map(([id, option]: [string, any]) => +id);
    }
    this.customerWinsWereFiltered = false;
  }

  filterCustomerWinOptions(this: FormWithCustomerWinSelect) {
    if (this.customerWinsWereFiltered) return;
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