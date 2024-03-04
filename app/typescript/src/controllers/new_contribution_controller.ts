import FormController from './form_controller';
import ModalController from './modal_controller';
import ResourceController from './resource_controller';
import { type TomInput, TomOption } from 'tom-select/dist/types/types';

export default class NewContributionController extends FormController {
  static outlets = ['resource', 'modal'];
  declare readonly resourceOutlets: ResourceController[];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'customerSelect', 
    'customerField', 
    'customerId', 
    'customerName', 
    'customerWinSelect', 
    'successCustomerId', 
    'contributorSelect', 
    'referrerSelect', 
  ];
  declare readonly customerSelectTarget: TomInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerIdTarget: HTMLInputElement;
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly customerWinSelectTarget: TomInput;
  declare readonly successCustomerIdTarget: HTMLInputElement;
  declare readonly contributorSelectTarget: TomInput;
  declare readonly referrerSelectTarget: TomInput;

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

  onChangeCustomer({ target: select }: { target: TomInput }) {
    const customerVal = select.value;
    const customerId = isNaN(+customerVal) ? null : customerVal;
    const customerWinWasSelected = (
      this.customerWinSelectTarget.value && typeof +this.customerWinSelectTarget.value === 'number'
    );
    this.successCustomerIdTarget.value = customerId || '';
    this.customerFieldTargets.forEach(field => field.disabled = Boolean(customerId));
    if (customerId) {
      this.setCustomerCustomerWinIds(customerId);
      this.customerWinSelectTarget.tomselect!.clear();
    } else {
      this.customerIdTarget.value = '';
      this.customerNameTarget.value = customerVal;
      if (customerWinWasSelected) this.customerWinSelectTarget.tomselect!.clear();
    }
  }

  onChangeCustomerWin({ target: select }: { target: TomInput }) {
    if (
      !(this.customerWinsCtrl instanceof ResourceController) ||
      !(this.contributorsCtrl instanceof ResourceController)
    ) return;
    const customerWinId = +select.value;
    const customerWin = this.customerWinsCtrl.dt
      .column('success:name').data().toArray()
      .find(customerWin => customerWin.id === customerWinId);
    const customerWinContributorIds: number[] = customerWin && this.contributorsCtrl.dt.data().toArray()
      .filter(contribution => contribution.success.id === customerWin.id)
      .map(contribution => contribution.contributor.id);
    const tsOptions = this.contributorSelectTarget.tomselect!.options;
    if (customerWin) {
      this.customerSelectTarget.tomselect!.setValue(customerWin.customerId, true);
      this.setCustomerCustomerWinIds(customerWin.customerId);

      // disable contributor option for any contributors that already have a contribution for the customer win
      customerWinContributorIds.forEach(contributorId => {
        const newOptionSettings = { value: contributorId, text: tsOptions[contributorId].text, disabled: true  };
        this.contributorSelectTarget.tomselect!.updateOption(contributorId.toString(), newOptionSettings);
      });
    } else {
      Object.entries(tsOptions).forEach(([value, option]) => {
        if (option.disabled) {
          this.contributorSelectTarget.tomselect!.updateOption(value, { value, text: option.text, disabled: false });
        }
      }); 
    }
  }

  filterCustomerWins(e: Event) {
    if (this.customerWinsWereFiltered) return false;
    Object.keys(this.customerWinSelectTarget.tomselect!.options).forEach(customerWinId => {
      const tsOption = this.customerWinSelectTarget.tomselect!.getOption(customerWinId) as TomOption;
      const shouldHide = this.customerCustomerWinIds.length && !this.customerCustomerWinIds.includes(+customerWinId);
      tsOption.classList.toggle('hidden', shouldHide);
    });
    this.customerWinsWereFiltered = true;
  }

  setCustomerCustomerWinIds(customerId = this.customerSelectTarget.value) {
    if (customerId) {
      if (!(this.customerWinsCtrl instanceof ResourceController)) return;
      this.customerCustomerWinIds = this.customerWinsCtrl.dt.rows().data().toArray()
        .filter((customerWin: CustomerWin) => customerWin.customer.id === +customerId)
        .map((customerWin: CustomerWin) => customerWin.id)
    }
    this.customerWinsWereFiltered = false;
  }
}