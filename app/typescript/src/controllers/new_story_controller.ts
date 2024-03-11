import { Controller } from "@hotwired/stimulus";
import FormController from "./form_controller";
import type ModalController from "./modal_controller";

export default class NewStoryController extends FormController {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'storyTitle',
    'customerSelect',
    'customerField',
    'customerName',
    'customerWinSelect',
    'successField',
    'successName',
  ];
  declare readonly storyTitleTarget: HTMLInputElement;
  declare readonly customerSelectTarget: TomSelectInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly customerWinSelectTarget: TomSelectInput;
  declare readonly successFieldTargets: HTMLInputElement[];
  declare readonly successNameTarget: HTMLInputElement;

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

  onChangeCustomerWin() {
    this.handleCustomerWinChange();
  }
}