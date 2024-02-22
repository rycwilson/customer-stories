import FormController from './form_controller';
import ModalController from './modal_controller';
import { capitalize } from '../utils';
import { type TomInput } from 'tom-select/dist/types/types';

export default class CustomerWinFormController extends FormController {
  [key: string]: any;

  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'successCustomerId',
    'customerField',
    'customerName',
    'referrerSelect', 
    'referrerFields',
    'referrerField',
    'contributorSelect', 
    'contributorFields',
    'contributorField',
  ];
  declare readonly successCustomerIdTarget: HTMLInputElement;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly referrerSelectTarget: TomInput;
  declare readonly referrerFieldsTarget: HTMLDivElement;
  declare readonly referrerFieldTargets: HTMLInputElement[];
  declare readonly contributorSelectTarget: TomInput;
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly contributorFieldTargets: HTMLInputElement[];

  connect() {
  }

  onChangeSource({ target: input }: { target: EventTarget }) {
    if (!(input instanceof HTMLInputElement)) return;
    $(input).tab('show');
    this.dispatch('source-changed', { detail: capitalize(input.value) })
    // TODO: reset validation for whichever panel was hidden
  }

  onChangeCustomer({ target: select }: { target: TomInput }) {
    const customerVal = select.value;
    const customerId = isNaN(+customerVal) ? null : customerVal;
    this.successCustomerIdTarget.disabled = !customerId
    this.customerFieldTargets.forEach(field => field.disabled = !!customerId);
    if (!customerId) this.customerNameTarget.value = customerVal;
  }

  onChangeContact({ target: select }: { target: TomInput }) {
    const contactType = select.dataset.tomselectTypeValue as 'referrer' | 'contributor';
    const isNewContact = select.value === '0';
    const isExistingContact = select.value && !isNewContact;

    // enable/disable submission via the [name] attribute => precludes ui changes
    select.setAttribute('name', select.value && !isNewContact ? select.dataset.fieldName as string : '');
    this[`${contactType}FieldTargets`].forEach(input => {
      if (!input.name.includes('success_contact')) input.value = '';
      input.disabled = input.name.includes('success_contact') ? (!isExistingContact && !isNewContact) : !isNewContact;
      input.required = isNewContact && input.type !== 'hidden';
    });
    if (isNewContact) {
      this[`${contactType}FieldsTarget`].classList.remove('hidden');
      (this[`${contactType}FieldTargets`].find(input => input.name.includes('first')) as HTMLInputElement).focus();
    } else {
      this[`${contactType}FieldsTarget`].classList.add('hidden');
    }
  }

  onChangeCustomerContact({ target: select }: { target: TomInput }) {
    this.customerContactBoolFieldTarget.disabled = !select.value;
  }
}