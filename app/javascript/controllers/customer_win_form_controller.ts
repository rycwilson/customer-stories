import { Controller } from '@hotwired/stimulus';
import { capitalize } from '../util';

export default class extends Controller<HTMLFormElement> {
  static outlets = ['modal'];
  static targets = [
    'referrerSelect', 'referrerFields', 'contributorSelect', 'contributorFields', 'successCustomerId', 
    'customerField', 'customerId', 'customerName', 'customerContactBoolField'
  ];

  onSourceChange(e: Event) {
    if (!(e.target instanceof HTMLInputElement)) return;
    const { target: input } = e;
    $(input).tab('show');
    this.dispatch('source-changed', { detail: capitalize(e.target.value) })
    // TODO: reset validation for whichever panel was hidden
  }

  onCustomerChange(e) {
    const customerVal = e.target.value;
    const customerId = isNaN(customerVal) ? null : customerVal;
    this.successCustomerIdTarget.value = customerId;
    this.customerFieldTargets.forEach(field => field.disabled = Boolean(customerId));
    if (customerId) {
      // ...
    } else {
      this.customerIdTarget.value = '';
      this.customerNameTarget.value = customerVal;
    }
  }

  onContactChange({ target: select }) {
    const isNewContact = select.value === '0';
    const isExistingContact = select.value && !isNewContact;
    const shouldDisableSelect = isNewContact || !isExistingContact;
    const contactFields = select.isSameNode(this.contributorSelectTarget) ? 
      this.contributorFieldsTarget : 
      this.referrerFieldsTarget;
    // select.disabled = shouldDisableSelect;

    // the field is initially disabled via an empty name attribute
    // thereafter, the select can be disabled without affecting tomselect,
    // however better to be consistent and stick with enabling/disabling via name attribute
    select.name = shouldDisableSelect ? '' : select.dataset.fieldName;
    contactFields.setAttribute('data-new-contact-should-enable-value', isNewContact);
  }

  onCustomerContactChange({ target: select }) {
    this.customerContactBoolField.disabled = !select.value;
  }
}