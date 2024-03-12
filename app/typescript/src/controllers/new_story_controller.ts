import FormController from "./form_controller";
import type ResourceController from "./resource_controller";
import type ModalController from "./modal_controller";

export default class NewStoryController extends FormController<NewStoryController>{
  // outlets
  declare readonly resourceOutlets: ResourceController[];
  declare readonly modalOutlet: ModalController;

  // targets
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