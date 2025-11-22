import type ResourceController from './resource_controller';
import FormController from './form_controller';

export default class NewCustomerWinController extends FormController<NewCustomerWinController> {
  static outlets = ['customer-wins'];
  declare customerWinsOutlet: ResourceController;

  static targets = [...super.targets, 'response'];
  declare readonly responseTarget: HTMLDivElement;
  declare readonly hasResponseTarget: boolean;

  // Any shared targets can be defined through `static targets` in the parent controller
  // When narrowing the `this` context (as in FormController.prototype.onChangeContact), declarations must appear in each subclass 
  declare readonly contributorSelectTarget: TomSelectInput;
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly contributorFieldTargets: HTMLInputElement[];
  declare readonly referrerSelectTarget: TomSelectInput;
  declare readonly referrerFieldsTarget: HTMLDivElement;
  declare readonly referrerFieldTargets: HTMLInputElement[];
  declare readonly customerContactBoolFieldTarget: HTMLInputElement;

  declare responseObserver: MutationObserver;

  connect() {
    super.connect();
    this.autofillNewContactPasswords();

    this.responseObserver = new MutationObserver(_ => {
      if (this.hasResponseTarget) {
        const rowData = JSON.parse(this.responseTarget.dataset.rowData as string);
        const rowPartialHtml = this.responseTarget.dataset.rowPartialHtml as string;
        this.customerWinsOutlet.element.addEventListener('datatable:drawn', () => {
          setTimeout(() => this.customerWinsOutlet.dashboardOutlet.modalOutlet.hide());
        }, { once: true });
        this.customerWinsOutlet.newRowValue = { rowData, rowPartialHtml }
        this.responseTarget.remove();
      }
    })
    this.responseObserver.observe(this.element, { childList: true, subtree: false });
  }

  disconnect() {
    this.responseObserver.disconnect();
  }
  
  // onChangeSource({ target: input }: { target: EventTarget }) {
  // }

  onChangeCustomerContact({ target: select }: { target: TomSelectInput }) {
    this.customerContactBoolFieldTarget.disabled = !select.value;
  }
}