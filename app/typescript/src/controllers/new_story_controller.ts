import { Controller } from "@hotwired/stimulus";
import FormController from "./form_controller";
import type ModalController from "./modal_controller";

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
  declare readonly customerSelectTarget: TomSelectInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly customerWinSelectTarget: TomSelectInput;
  declare readonly storyTitleTarget: HTMLInputElement;

  declare customerCustomerWinIds: number[];
  customerWinsWereFiltered: boolean = false;

  connect() {
    $(this.modalOutlet.element).on('shown.bs.modal', () => this.storyTitleTarget.focus());
    if (this.shouldFilterCustomerWinOptionsOnConnect()) {
      // wait for tomselect inputs to initialize
      window.setTimeout(this.setCustomerWinIds.bind(this));
    }
  }

  onChangeCustomer() {
    this.handleCustomerChange();
  }

  onChangeCustomerWin(this: NewStoryController, { target: select }: { target: TomSelectInput }) {
    // const customerWinId = isNaN(+select.value) ? null : +select.value;
    // this.customerWinSelectTarget.disabled = !customerWinId;
    // this.customerWinFieldTargets.forEach((field: HTMLInputElement) => field.disabled = !!customerWinId);
    // this.customerNameTarget.value = !customerId ? customerSelectValue : '';
  }
}