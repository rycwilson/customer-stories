import { TurboSubmitStartEvent } from "@hotwired/turbo";
import FormController from "./form_controller";

export default class CompanyStoryTagsController extends FormController<CompanyStoryTagsController> {
  static targets = ['hiddenField'];  
  declare hiddenFieldTargets: HTMLInputElement[];

  connect() {
  }

  onAddTag({ detail: { tagName, source, cancel = false} }: { detail: { tagName: string, source: string, cancel?: boolean } }) {
    if (cancel) {
      const inputsContainer = this.element.querySelector(`[data-new-tag="${source}__${tagName}"]`);
      if (inputsContainer) inputsContainer.remove();
    } else {
      const i = this.hiddenFieldTargets.length;
      this.element.insertAdjacentHTML('beforeend', `
        <div data-new-tag="${source}__${tagName}">
          <input type="hidden" name="company[${source}_attributes][${i}][id]" value="" data-company-story-tags-target="hiddenField">
          <input type="hidden" name="company[${source}_attributes][${i}][name]" value="${tagName}" data-company-story-tags-target="hiddenField">
        </div>
      `);
    }
  }

  onRemoveTag({ detail: { tagName, source, cancel } }: { detail: { tagName: string, source: string, cancel: boolean } }) {
    const nameInput = this.hiddenFieldTargets.find(input => (
      input.name.includes(`[${source}_attributes]`) && input.value === tagName
    ));
    const _destroyInput = nameInput?.nextElementSibling;
    if (_destroyInput instanceof HTMLInputElement) _destroyInput.checked = !cancel;
  }

  onTurboSubmitStart(e: TurboSubmitStartEvent) {
    console.log(e.detail)
    const { formSubmission } = e.detail;
    const form = formSubmission.formElement;
    const formData = new FormData(form);

    console.log(Object.fromEntries(formData.entries()));


    e.detail.formSubmission.stop()
    // const { formSubmission, fetchOptions } = e.detail;

  }
}