import FormController from './form_controller';
import ModalController from './modal_controller';
import { capitalize } from '../utils';
import { type TomInput } from 'tom-select/dist/types/types';

export default class NewCustomerWinController extends FormController {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static targets = [];

  connect() {
  }

  onChangeSource({ target: input }: { target: EventTarget }) {
    if (!(input instanceof HTMLInputElement)) return;
    $(input).tab('show');
    this.dispatch('source-changed', { detail: capitalize(input.value) })
    // TODO: reset validation for whichever panel was hidden
  }

  onChangeCustomer({ target: select }: { target: TomInput }) {
    super.setCustomerFields(select.value);
  }

  onChangeCustomerContact({ target: select }: { target: TomInput }) {
    this.customerContactBoolFieldTarget.disabled = !select.value;
  }
}