import FormController from './form_controller';
import type ModalController from './modal_controller';
import { capitalize } from '../utils';

export default class NewCustomerWinController extends FormController<NewCustomerWinController> {
  declare readonly modalOutlet: ModalController;

  // targets
  declare readonly customerSelectTarget: TomSelectInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly contributorSelectTarget: TomSelectInput;
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly contributorFieldTargets: HTMLInputElement[];
  declare readonly referrerSelectTarget: TomSelectInput;
  declare readonly referrerFieldsTarget: HTMLDivElement;
  declare readonly referrerFieldTargets: HTMLInputElement[];
  declare readonly requiredFieldTargets: (TomSelectInput | HTMLInputElement)[];
  declare readonly customerContactBoolFieldTarget: HTMLInputElement;

  connect() {
    this.removeErrorsOnValidInput();
    this.autofillNewContactPasswords();
  }

  beforeSendXHR(e: CustomEvent) {
    this.validate(e);
  }

  onChangeSource({ target: input }: { target: EventTarget }) {
    if (!(input instanceof HTMLInputElement)) return;
    $(input).tab('show');
    this.dispatch('source-changed', { detail: capitalize(input.value) })
    // TODO: reset validation for whichever panel was hidden
  }

  onChangeCustomer() {
    this.handleCustomerChange();
  }

  onChangeCustomerContact({ target: select }: { target: TomSelectInput }) {
    this.customerContactBoolFieldTarget.disabled = !select.value;
  }
}