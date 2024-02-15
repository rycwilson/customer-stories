import { Controller } from '@hotwired/stimulus';
import ResourceController from './resource_controller';
import type { TomselectOption, TomselectOptions } from '../tomselect';

export default class ContributionFormController extends Controller<HTMLFormElement> {
  static outlets = ['resource'];
  declare readonly resourceOutlets: ResourceController[];

  static targets = [
    'customerSelect', 'customerField', 'customerId', 'customerName', 'customerWinSelect', 'successCustomerId', 
    'contributorSelect', 'referrerSelect', 'contributorFields', 'referrerFields'
  ];
  declare readonly customerSelectTarget: HTMLSelectElement;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerIdTarget: HTMLInputElement;
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly customerWinSelectTarget: HTMLSelectElement;
  declare readonly successCustomerIdTarget: HTMLInputElement;
  declare readonly contributorSelectTarget: HTMLSelectElement;
  declare readonly referrerSelectTarget: HTMLSelectElement;
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly referrerFieldsTarget: HTMLDivElement;

  customerCustomerWinIds: number[] = [];
  customerWinsWereFiltered: boolean = false;
  // beforeAjaxHandler: () => void = 

  initialize() {
    // this.beforeAjaxHandler = this.beforeAjax.bind(this);
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
    return this.resourceOutlets.find(outlet => outlet.resourceName === 'contributions');
  }

  onChangeCustomer({ target: select }: { target: EventTarget }) {
    if (!(select instanceof HTMLSelectElement)) return;
    const customerVal = select.value;
    const customerId = isNaN(+customerVal) ? null : customerVal;
    const customerWinWasSelected = (
      this.customerWinSelectTarget.value && typeof +this.customerWinSelectTarget.value === 'number'
    );
    this.successCustomerIdTarget.value = customerId || '';
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

  onChangeCustomerWin(e: Event) {
    if (
      !(this.customerWinsCtrl instanceof ResourceController) ||
      !(this.contributorsCtrl instanceof ResourceController) ||
      !(e.target instanceof HTMLSelectElement)
    ) return;
    const select = e.target;
    const customerWinId = +select.value;
    const customerWin = this.customerWinsCtrl.dt.column('success:name').data().toArray()
      .find((customerWin: CustomerWin) => customerWin.id === customerWinId);
    const customerWinContributorIds: number[] = customerWin && this.contributorsCtrl.dt.data().toArray()
      .filter((contribution: Contribution) => contribution.success?.id === customerWin.id)
      .map((contribution: Contribution) => contribution.contributor?.id);
    const tsOptions: TomselectOptions = this.contributorSelectTarget.tomselect.options;
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
      Object.entries(tsOptions).forEach(([value, option]: [string, TomselectOption]) => {
        if (option.disabled) {
          this.contributorSelectTarget.tomselect.updateOption(value, { value, text: option.text, disabled: false });
        }
      });
    }
  }

  onChangeContact({ target: select }: { target: EventTarget }) {
    if (!(select instanceof HTMLSelectElement)) return;
    const isNewContact = select.value === '0';
    const contactFields = select === this.contributorSelectTarget ? 
      this.contributorFieldsTarget : 
      this.referrerFieldsTarget;
    contactFields.setAttribute('data-new-contact-should-enable-value', isNewContact.toString());
  }

  // beforeAjax(e: Event, xhr: XMLHttpRequest, settings: object) {
  //   // a.preventDefault()
  // }

  filterCustomerWins(e: Event) {
    if (this.customerWinsWereFiltered) return false;
    Object.keys(this.customerWinSelectTarget.tomselect.options).forEach(customerWinId => {
      const tsOption = this.customerWinSelectTarget.tomselect.getOption(customerWinId);
      const shouldHide = this.customerCustomerWinIds.length && !this.customerCustomerWinIds.includes(+customerWinId);
      tsOption.classList.toggle('hidden', shouldHide);
    });
    this.customerWinsWereFiltered = true;
  }

  setCustomerCustomerWinIds(customerId = this.customerSelectTarget.value) {
    if (customerId) {
      if (!(this.customerWinsCtrl instanceof ResourceController)) return;
      this.customerCustomerWinIds = this.customerWinsCtrl.dt.column('success:name').data().toArray()
        .filter((customerWin: CustomerWin) => customerWin.customer.id === +customerId)
        .map((customerWin: CustomerWin) => customerWin.id)
    }
    this.customerWinsWereFiltered = false;
  }
}