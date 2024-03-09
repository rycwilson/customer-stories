import { Controller } from "@hotwired/stimulus";
import FormController from "./form_controller";
import { type TomInput } from 'tom-select/dist/types/types';

export default class NewStoryController extends FormController {
  static targets = [
    'successCustomerId', 
    'customerSelect',
    'customerField',
    'customerName',
    'customerWinSelect'
  ];
  declare readonly successCustomerIdTarget: HTMLInputElement;
  declare readonly customerSelectTarget: TomInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly customerWinSelectTarget: TomInput;

  declare customerCustomerWinIds: number[];
  customerWinsWereFiltered: boolean = false;

  connect() {
    if (this.hasExistingCustomer) this.setCustomerWinOptions();
  }

  onChangeCustomer({ target: select }: { target: TomInput }) {
    debugger;
    const customerId = this.setCustomerFields(select.value);
    this.setCustomerWinFields(customerId);
    if (customerId) {
      this.setCustomerWinOptions();
    } else {
      // this.customerCustomerWinIds = [];
      this.customerWinsWereFiltered = false;
    }
  }

  onChangeCustomerWin() {
  }
}