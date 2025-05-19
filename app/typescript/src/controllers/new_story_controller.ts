import FormController from "./form_controller";
import type { TurboSubmitEndEvent, TurboVisitEvent, FetchResponse } from "@hotwired/turbo";

export default class NewStoryController extends FormController<NewStoryController> {
  static targets = [...FormController.targets, 'storyTitle', 'successPlaceholder']
  declare readonly storyTitleTarget: HTMLInputElement;
  declare readonly curatorSelectTarget: TomSelectInput;

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

  onTurboSubmitEnd({ detail: { fetchResponse: { response } } } : { detail: { fetchResponse: FetchResponse } }) {
    const redirectUrl = response.headers.get('Location');
    if (response.ok && redirectUrl) {
      document.documentElement.addEventListener(
        'turbo:load', 
        (e: TurboVisitEvent) => {
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