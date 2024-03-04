import { Controller } from "@hotwired/stimulus";
import FormController from "./form_controller";
import { type TomInput } from 'tom-select/dist/types/types';

export default class NewStoryController extends FormController {
  static targets = [
    'customerSelect', 
    'customerField', 
    'customerId', 
    'customerName', 
    'customerWinSelect', 
    'successCustomerId', 
  ];
  declare readonly customerSelectTarget: TomInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerIdTarget: HTMLInputElement;
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly customerWinSelectTarget: TomInput;
  declare readonly successCustomerIdTarget: HTMLInputElement;

  onChangeCustomer() {

  }

  onChangeCustomerWin() {

  }

  filterCustomerWins() {
    
  }
}