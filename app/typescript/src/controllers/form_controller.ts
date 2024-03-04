import { Controller } from '@hotwired/stimulus';
import { type TomInput } from 'tom-select/dist/types/types';

export default class FormController extends Controller<HTMLFormElement> {
  [key: string]: any;

  static targets = [
    'referrerFields',
    'referrerField',
    'contributorFields',
    'contributorField',
    'requiredField'
  ];
  declare readonly referrerFieldsTarget: HTMLDivElement;
  declare readonly referrerFieldTargets: HTMLInputElement[];
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly contributorFieldTargets: HTMLInputElement[];
  declare readonly requiredFieldTargets: [TomInput | HTMLInputElement];

  connect() {
    console.log('connect form', this.element.id)
    this.removeErrorsOnValidInput();
    this.autofillNewContactPasswords();
  }

  beforeSendXHR(e: CustomEvent) {
    console.log(e)
    if (!this.isValid()) {
      console.log('not valid')
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