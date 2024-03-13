import FormController from "./form_controller";

export default class NewStoryController extends FormController<NewStoryController> {
  declare readonly storyTitleTarget: HTMLInputElement;
  declare readonly customerWinSelectTarget: TomSelectInput;
  declare customerCustomerWinIds: number[];
  customerWinsWereFiltered: boolean = false;

  connect() {
    super.connect();
    $(this.modalOutlet.element).on('shown.bs.modal', () => this.storyTitleTarget.focus());
  }
}