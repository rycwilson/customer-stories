import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['referrerSelect', 'referrerFields', 'contributorSelect', 'contributorFields'];

  onContactChange({ target: select }) {
    const isNewContact = select.value === '0';
    const contactFields = select.isSameNode(this.contributorSelectTarget) ? 
      this.contributorFieldsTarget : 
      this.referrerFieldsTarget;
    contactFields.setAttribute('data-new-contact-should-enable-value', isNewContact)
  }
}