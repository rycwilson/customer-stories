import FormController from './form_controller';

export default class NewCustomerWinController extends FormController<NewCustomerWinController> {
  // Any shared targets can be defined through `static targets` in the parent controller
  // When narrowing the `this` context (as in FormController.prototype.onChangeContact), declarations must appear in each subclass 
  declare readonly contributorSelectTarget: TomSelectInput;
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly contributorFieldTargets: HTMLInputElement[];
  declare readonly referrerSelectTarget: TomSelectInput;
  declare readonly referrerFieldsTarget: HTMLDivElement;
  declare readonly referrerFieldTargets: HTMLInputElement[];
  declare readonly customerContactBoolFieldTarget: HTMLInputElement;

  connect() {
    super.connect();
    this.autofillNewContactPasswords();
  }
  
  // onChangeSource({ target: input }: { target: EventTarget }) {
  // }

  onChangeCustomerContact({ target: select }: { target: TomSelectInput }) {
    this.customerContactBoolFieldTarget.disabled = !select.value;
  }
}