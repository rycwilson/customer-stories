import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static outlets = ['resource'];
  static targets = [
    'customerSelect', 'customerField', 'customerId', 'customerName', 'customerWinSelect', 'successCustomerId', 
    'contributorSelect', 'referrerSelect', 'contributorFields', 'referrerFields'
  ];

  customerCustomerWinIds;
  customerWinsWereFiltered;
  beforeAjaxHandler;

  initialize() {
    this.beforeAjaxHandler = this.beforeAjax.bind(this);
  }

  connect() {
    this.setCustomerCustomerWinIds();
  }

  // resourceOutletConnected(outlet) {
  //   if (outlet.resourceName === 'customerWins') this.customerWinsCtrl = outlet;
  //   if (outlet.resourceName === 'contributors') this.contributorsCtrl = outlet;
  // }

  get customerWinsCtrl() {
    return this.resourceOutlets.find(outlet => outlet.resourceName === 'customerWins');
  }

  get contributorsCtrl() {
    return this.resourceOutlets.find(outlet => outlet.resourceName === 'contributors');
  }

  onCustomerChange(e) {
    const customerVal = e.target.value;
    const customerId = isNaN(customerVal) ? null : customerVal;
    const customerWinWasSelected = this.customerWinSelectTarget.value && !isNaN(this.customerWinSelectTarget.value);
    this.successCustomerIdTarget.value = customerId;
    this.customerFieldTargets.forEach(field => field.disabled = Boolean(customerId));
    if (customerId) {
      this.setCustomerCustomerWinIds(customerId);
      this.customerWinSelectTarget.tomselect.clear();
    } else {
      this.customerIdTarget.value = '';
      this.customerNameTarget.value = customerVal;
      if (customerWinWasSelected) this.customerWinSelectTarget.tomselect.clear();
    }
  }

  onCustomerWinChange(e) {
    const customerWin = this.customerWinsCtrl.dt.column('success:name').data().toArray()
      .find(customerWin => customerWin.id === Number(e.target.value));
    const customerWinContributorIds = customerWin && this.contributorsCtrl.dt.data().toArray()
      .filter(contribution => contribution.success.id === customerWin.id)
      .map(contribution => contribution.contributor.id);
    const tsOptions = this.contributorSelectTarget.tomselect.options;
    if (customerWin) {
      this.customerSelectTarget.tomselect.setValue(customerWin.customerId, true);
      this.setCustomerCustomerWinIds(customerWin.customerId);

      // disable contributor option for any contributors that already have a contribution for the customer win
      customerWinContributorIds.forEach(contributorId => {
        this.contributorSelectTarget.tomselect.updateOption(
          contributorId, { value: contributorId, text: tsOptions[contributorId].text, disabled: true  }
        );
      });
    } else {
      Object.entries(tsOptions).forEach(([value, option]) => {
        if (option.disabled)
          this.contributorSelectTarget.tomselect.updateOption(value, { value, text: option.text, disabled: false })
      });
    }
  }

  onContactChange({ target: select }) {
    const isNewContact = select.value === '0';
    const contactFields = select.isSameNode(this.contributorSelectTarget) ? 
      this.contributorFieldsTarget : 
      this.referrerFieldsTarget;
    contactFields.setAttribute('data-new-contact-should-enable-value', isNewContact)
  }

  beforeAjax(a, b, c) {
    // a.preventDefault()
  }

  filterCustomerWins(e) {
    if (this.customerWinsWereFiltered) return false;
    Object.keys(this.customerWinSelectTarget.tomselect.options).forEach(customerWinId => {
      const tsOption = this.customerWinSelectTarget.tomselect.getOption(customerWinId);
      const shouldHide = this.customerCustomerWinIds.length && !this.customerCustomerWinIds.includes(Number(customerWinId));
      tsOption.classList.toggle('hidden', shouldHide);
    });
    this.customerWinsWereFiltered = true;
  }

  setCustomerCustomerWinIds(customerId = this.customerSelectTarget) {
    this.customerCustomerWinIds = customerId ?
      this.customerWinsCtrl.dt.column('success:name').data().toArray()
        .filter(customerWin => customerWin.customerId === Number(customerId))
        .map(customerWin => customerWin.id) :
      [];
    this.customerWinsWereFiltered = false;
  }
}