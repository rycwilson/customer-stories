import FormController from './form_controller';
import type ModalController from './modal_controller';
import ResourceController from './resource_controller';
import { type TomOptions } from 'tom-select/dist/types/types';

export default class NewContributionController extends FormController {
  static outlets = ['resource', 'modal'];
  declare readonly resourceOutlets: ResourceController[];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'customerSelect',
    'customerField',
    'customerName',
    'customerWinSelect',
    'successField',
    'successName', 
    'contributorSelect', 
    'referrerSelect', 
  ];
  declare readonly customerSelectTarget: TomSelectInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly customerWinSelectTarget: TomSelectInput;
  declare readonly successFieldTargets: HTMLInputElement[];
  declare readonly successNameTarget: HTMLInputElement;
  declare readonly contributorSelectTarget: TomSelectInput;
  declare readonly referrerSelectTarget: TomSelectInput;

  declare customerCustomerWinIds: number[];
  customerWinsWereFiltered: boolean = false;

  initialize() {
    // this.beforeAjaxHandler = this.beforeAjax.bind(this);
  }

  connect() {
    if (this.shouldFilterCustomerWinOptionsOnConnect()) {
      // wait for tomselect inputs to initialize
      window.setTimeout(this.setCustomerWinIds.bind(this));
    }
  }

  get customerWinsCtrl() {
    return this.resourceOutlets.find(outlet => outlet.resourceName === 'customerWins');
  }

  get contributorsCtrl() {
    return this.resourceOutlets.find(outlet => outlet.resourceName === 'contributions');
  }

  onChangeCustomer() {
    this.handleCustomerChange();
  }

  onChangeCustomerWin() {
    this.handleCustomerWinChange();
  }
}