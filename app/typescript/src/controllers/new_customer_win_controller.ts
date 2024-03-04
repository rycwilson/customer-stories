import FormController from './form_controller';
import ModalController from './modal_controller';
import { capitalize } from '../utils';
import { type TomInput } from 'tom-select/dist/types/types';

export default class NewCustomerWinController extends FormController {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'successCustomerId',
    'customerField',
    'customerName',
    'referrerSelect', 
    'contributorSelect', 
  ];
  declare readonly successCustomerIdTarget: HTMLInputElement;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly referrerSelectTarget: TomInput;
  declare readonly contributorSelectTarget: TomInput;

  connect() {
  }

  onChangeSource({ target: input }: { target: EventTarget }) {
    if (!(input instanceof HTMLInputElement)) return;
    $(input).tab('show');
    this.dispatch('source-changed', { detail: capitalize(input.value) })
    // TODO: reset validation for whichever panel was hidden
  }

  onChangeCustomer({ target: select }: { target: TomInput }) {
    const customerVal = select.value;
    const customerId = isNaN(+customerVal) ? null : customerVal;
    this.successCustomerIdTarget.disabled = !customerId
    this.customerFieldTargets.forEach(field => field.disabled = !!customerId);
    if (!customerId) this.customerNameTarget.value = customerVal;
  }

  onChangeCustomerContact({ target: select }: { target: TomInput }) {
    this.customerContactBoolFieldTarget.disabled = !select.value;
  }
}