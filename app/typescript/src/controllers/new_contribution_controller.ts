import FormController from './form_controller';
// import type ModalController from './modal_controller';

export default class NewContributionController extends FormController<NewContributionController> {
  declare readonly customerWinSelectTarget: TomSelectInput;
  declare readonly contributorSelectTarget: TomSelectInput;
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly contributorFieldTargets: HTMLInputElement[];
  declare readonly referrerSelectTarget: TomSelectInput;
  declare readonly referrerFieldsTarget: HTMLDivElement;
  declare readonly referrerFieldTargets: HTMLInputElement[];
  declare customerCustomerWinIds: number[];
  customerWinsWereFiltered: boolean = false;

  connect() {
    super.connect();
    const hasExistingCustomer = +this.customerSelectTarget.value;
    if (hasExistingCustomer && !this.customerWinSelectTarget.classList.contains('readonly')) {
      window.setTimeout(this.setCustomerWinIds.bind(this));
    }
    this.autofillNewContactPasswords();
  }
}