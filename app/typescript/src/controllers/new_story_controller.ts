import FormController from "./form_controller";

export default class NewStoryController extends FormController<NewStoryController> {
  static targets = [...FormController.targets, 'storyTitle', 'successPlaceholder']
  declare readonly storyTitleTarget: HTMLInputElement;

  handleShownModal = this.onShownModal.bind(this);

  connect() {
    super.connect();
    $(this.modalOutlet.element).on('shown.bs.modal', this.handleShownModal);
  }

  disconnect() {
    $(this.modalOutlet.element).off('shown.bs.modal', this.handleShownModal);
    super.disconnect();
  }

  onShownModal() {
    this.storyTitleTarget.focus();
  }
}