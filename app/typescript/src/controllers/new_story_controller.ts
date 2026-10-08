import FormController from "./form_controller";
import type { TurboSubmitEndEvent, TurboVisitEvent, FetchResponse } from "@hotwired/turbo";

export default class NewStoryController extends FormController<NewStoryController> {
  static targets = [...FormController.targets, 'successPlaceholder']
  declare readonly curatorSelectTarget: TomSelectInput;

  onShownModal = this.handleShownModal.bind(this);

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

  onTurboSubmitEnd(e: CustomEvent<{ fetchResponse: FetchResponse }>) {
    const { response } = e.detail.fetchResponse;
    const redirectUrl = response.headers.get('Location');
    if (response.ok && redirectUrl) {
      document.documentElement.addEventListener(
        'turbo:load', 
        (_e: TurboVisitEvent) => {
          const toaster = document.getElementById('toaster');
          if (toaster) {
            toaster.setAttribute('data-toast-flash-value', JSON.stringify({ notice: 'Story created successfully' }));
          }
        },
        { once: true}
      )
      Turbo.visit(redirectUrl);  
    }
  }
}