import FormController from './form_controller';
import ModalController from './modal_controller';
import ResourceController from './resource_controller';
import { type TomInput, TomOption } from 'tom-select/dist/types/types';

export default class NewContributionController extends FormController {
  static outlets = ['resource', 'modal'];
  declare readonly resourceOutlets: ResourceController[];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'successCustomerId', 
    'customerSelect',
    'customerField',
    'customerName',
    'customerWinSelect',

    'contributorSelect', 
    'referrerSelect', 
  ];
  declare readonly successCustomerIdTarget: HTMLInputElement;
  declare readonly customerSelectTarget: TomInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;

  declare readonly customerWinSelectTarget: TomInput;
  declare readonly contributorSelectTarget: TomInput;
  declare readonly referrerSelectTarget: TomInput;

  declare customerCustomerWinIds: number[];
  customerWinsWereFiltered: boolean = false;

  initialize() {
    // this.beforeAjaxHandler = this.beforeAjax.bind(this);
  }

  connect() {
    if (this.hasExistingCustomer) this.setCustomerWinOptions();
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
    const customerId = this.setCustomerFields(select.value);
    this.setCustomerWinFields(customerId);
    if (customerId) {
      this.setCustomerWinOptions();
    } else {
      // this.customerCustomerWinIds = [];
      this.customerWinsWereFiltered = false;
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
      // this.setCustomerWinOptions(customerWin.customerId);

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
}