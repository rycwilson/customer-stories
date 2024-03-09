import FormController from './form_controller';
import type ModalController from './modal_controller';
import { capitalize } from '../utils';
import { type TomInput } from 'tom-select/dist/types/types';

export default class NewCustomerWinController extends FormController {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static targets = [
    'customerSelect',
    'customerField',
    'customerName',
    'contributorSelect', 
    'referrerSelect', 
  ];
  declare readonly customerSelectTarget: TomInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly contributorSelectTarget: TomInput;
  declare readonly referrerSelectTarget: TomInput;

  connect() {
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

  onChangeCustomerContact({ target: select }: { target: HTMLSelectElement & TomInput }) {
    this.customerContactBoolFieldTarget.disabled = !select.value;
  }
}