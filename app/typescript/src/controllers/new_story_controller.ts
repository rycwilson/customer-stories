import FormController from "./form_controller";
// import type { TurboSubmitEndEvent, TurboVisitEvent, FetchResponse } from "@hotwired/turbo";

export default class NewStoryController extends FormController<NewStoryController> {
  declare readonly customerSelectTarget: TomSelectInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerWinSelectTarget: TomSelectInput;
  declare readonly successFieldTargets: HTMLInputElement[];
  private onShownModal = this.handleShownModal.bind(this);

  connect() {
    super.connect();
    $(this.modalOutlet.element).on('shown.bs.modal', this.onShownModal);
  }

  disconnect() {
    $(this.modalOutlet.element).off('shown.bs.modal', this.onShownModal);
    super.disconnect();
  }

  handleShownModal() {
    // console.log('shown.bs.modal', this)
  }
}