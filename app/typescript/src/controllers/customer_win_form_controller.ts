import { Controller } from '@hotwired/stimulus';
import ModalController from './modal_controller';
import { capitalize } from '../utils';

export default class CustomerWinFormController extends Controller<HTMLFormElement> {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'referrerSelect', 'referrerFields', 'contributorSelect', 'contributorFields', 'successCustomerId', 
    'customerField', 'customerId', 'customerName', 'customerContactBoolField'
  ];
  declare readonly referrerSelectTarget: HTMLSelectElement;
  declare readonly referrerFieldsTarget: HTMLDivElement;
  declare readonly contributorSelectTarget: HTMLSelectElement;
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly successCustomerIdTarget: HTMLInputElement;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerIdTarget: HTMLInputElement;
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly customerContactBoolFieldTarget: HTMLInputElement;

  onChangeSource({ target: input }: { target: EventTarget }) {
    if (!(input instanceof HTMLInputElement)) return;
    $(input).tab('show');
    this.dispatch('source-changed', { detail: capitalize(input.value) })
    // TODO: reset validation for whichever panel was hidden
  }

  onChangeCustomer({ target: select }: { target: EventTarget }) {
    if (!(select instanceof HTMLSelectElement)) return;
    const customerVal = select.value;
    const customerId = isNaN(+customerVal) ? null : customerVal;
    this.successCustomerIdTarget.value = customerId || '';
    this.customerFieldTargets.forEach(field => field.disabled = Boolean(customerId));
    if (customerId) {
      // ...
    } else {
      this.customerIdTarget.value = '';
      this.customerNameTarget.value = customerVal;
    }
  }

  onChangeContact({ target: select }: { target: EventTarget }) {
    if (!(select instanceof HTMLSelectElement)) return;
    const isNewContact = select.value === '0';
    const isExistingContact = select.value && !isNewContact;
    const shouldDisableSelect = isNewContact || !isExistingContact;
    const contactFields = select === this.contributorSelectTarget ? 
      this.contributorFieldsTarget : 
      this.referrerFieldsTarget;
    // select.disabled = shouldDisableSelect;

    // the field is initially disabled via an empty name attribute
    // thereafter, the select can be disabled without affecting tomselect,
    // however better to be consistent and stick with enabling/disabling via name attribute
    select.name = shouldDisableSelect ? '' : select.dataset.fieldName || '';
    contactFields.setAttribute('data-new-contact-should-enable-value', isNewContact.toString());
  }

  onChangeCustomerContact({ target: select }: { target: EventTarget }) {
    if (!(select instanceof HTMLSelectElement)) return;
    this.customerContactBoolFieldTarget.disabled = !select.value;
  }
}