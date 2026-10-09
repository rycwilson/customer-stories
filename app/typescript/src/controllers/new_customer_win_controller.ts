import type ResourceController from './resource_controller';
import FormController from './form_controller';
import { autofillNewContactPasswords } from '../utils';

export default class NewCustomerWinController extends FormController<NewCustomerWinController> {
  static outlets = ['customer-wins'];
  static targets = [...super.targets, 'customerContactBoolField', 'response'];
  
  // Any shared targets can be defined through `static targets` in the parent controller
  // When narrowing the `this` context (as in FormController.prototype.handleChangeContact), 
  // declarations must appear in each subclass. 
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly contributorSelectTarget: TomSelectInput;
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly contributorFieldTargets: HTMLInputElement[];
  declare readonly referrerSelectTarget: TomSelectInput;
  declare readonly referrerFieldsTarget: HTMLDivElement;
  declare readonly referrerFieldTargets: HTMLInputElement[];
  private declare readonly customerContactBoolFieldTarget: HTMLInputElement;
  private declare readonly responseTarget: HTMLDivElement;
  private declare readonly hasResponseTarget: boolean;
  private declare readonly customerWinsOutlet: ResourceController;
  private responseObserver = new MutationObserver(_ => {
    if (this.hasResponseTarget) {
      const rowData = JSON.parse(this.responseTarget.dataset.rowData as string);
      const rowViewHtml = this.responseTarget.dataset.rowViewHtml as string;
      this.customerWinsOutlet.element.addEventListener('datatable:drawn', () => {
        setTimeout(() => this.customerWinsOutlet.dashboardOutlet.modalOutlet.hide());
      }, { once: true });
      this.customerWinsOutlet.newRowValue = { rowData, rowViewHtml }
      this.responseTarget.remove();
    }
  })

  connect() {
    super.connect();
    autofillNewContactPasswords.bind(this)();
    this.responseObserver.observe(this.element, { childList: true, subtree: false });
  }

  disconnect() {
    this.responseObserver.disconnect();
  }
  
  // handleChangeSource({ target: input }: { target: EventTarget }) {
  // }

  handleChangeCustomerContact({ target: select }: { target: TomSelectInput }) {
    this.customerContactBoolFieldTarget.disabled = !select.value;
  }
}