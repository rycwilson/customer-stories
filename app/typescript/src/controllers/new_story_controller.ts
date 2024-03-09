import { Controller } from "@hotwired/stimulus";
import FormController from "./form_controller";
import ModalController from "./modal_controller";
import { type TomInput } from 'tom-select/dist/types/types';

export default class NewStoryController extends FormController {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'successCustomerId', 
    'customerSelect',
    'customerField',
    'customerName',
    'customerWinSelect',
    'storyTitle'
  ];
  declare readonly successCustomerIdTarget: HTMLInputElement;
  declare readonly customerSelectTarget: TomInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly customerWinSelectTarget: TomInput;
  declare readonly storyTitleTarget: HTMLInputElement;

  declare customerCustomerWinIds: number[];
  customerWinsWereFiltered: boolean = false;

  connect() {
    $(this.modalOutlet.element).on('shown.bs.modal', () => this.storyTitleTarget.focus());
    if (this.shouldFilterCustomerWinOptionsOnConnect()) {
      // wait for tomselect inputs to initialize
      window.setTimeout(this.filterCustomerWinOptions.bind(this));
    }
  }

  onChangeCustomer({ target: select }: { target: TomInput }) {
    const customerId = this.setCustomerFields(select.value);
    this.setCustomerWinFields(customerId);
  }

  onChangeCustomerWin() {
  }
}