import type { TurboSubmitStartEvent, TurboSubmitEndEvent } from "@hotwired/turbo";
import FormController from "./form_controller";

export default class CompanyTagsController extends FormController<CompanyTagsController> {
  static targets = ['hiddenField'];  
  declare hiddenFieldTargets: HTMLInputElement[];

  private didSubmit = false;

  onAddTag({ detail: { tagName, source, cancel = false} }: { detail: { tagName: string, source: string, cancel?: boolean } }) {
    if (cancel) {
      const inputsContainer = this.element.querySelector(`[data-new-tag="${source}__${tagName}"]`);
      if (inputsContainer) inputsContainer.remove();
    } else {
      const i = this.hiddenFieldTargets.length;
      this.element.insertAdjacentHTML('beforeend', `
        <div data-new-tag="${source}__${tagName}">
          <input type="hidden" name="company[${source}_attributes][${i}][id]" value="" data-company-tags-target="hiddenField">
          <input type="hidden" name="company[${source}_attributes][${i}][name]" value="${tagName}" data-company-tags-target="hiddenField">
        </div>
      `);
    }
  }

  onRemoveTag({ detail: { tagName, source, cancel } }: { detail: { tagName: string, source: string, cancel: boolean } }) {
    const nameInput = this.hiddenFieldTargets.find(input => (
      input.name.includes(`[${source}_attributes]`) && input.value === tagName
    ));
    const _destroyInput = nameInput?.nextElementSibling;
    if (_destroyInput instanceof HTMLInputElement) {
      _destroyInput.checked = !cancel;
    }
  }

  // TODO confirm
  // Copilot says: "you can modify the FormData object directly. However, since the FormData object is already passed to 
  // Turbo's submission process, you cannot directly modify it in place. Instead, you need to update the form itself 
  // (e.g., by adding or modifying hidden inputs) so that Turbo picks up the changes when it submits the form."
  onTurboSubmitStart(e: TurboSubmitStartEvent) {
    // Without the `didSubmit` flag this callback will always stop the form submission
    if (this.didSubmit) {
      return;
    }

    const { formSubmission } = e.detail;

    // Group inputs by tag so they can be disabled if the tag is not being added or removed
    const tagInputGroups = this.hiddenFieldTargets.reduce((
      groups: { [key: string]: HTMLInputElement[] }, 
      input: HTMLInputElement
    ) => {
      const match = input.name.match(/company\[(?<source>\w+)_attributes\]\[(?<key>\d+)\]/);
      const source = match?.groups?.source;
      const key = match?.groups?.key;
      if (source && key) {
        const inputs = groups[`${source}_${key}`];
        groups[`${source}_${key}`] = inputs ? [...inputs, input] : [input];
      }
      return groups;
    }, {});
    
    for (const [_, inputs] of Object.entries(tagInputGroups)) {
      const idInput = inputs.find(input => input.name.includes('[id]'));
      const _destroyInput = inputs.find(input => input.name.includes('[_destroy]'));
      const isNewTag = idInput?.value === '';
      const isRemovedTag = _destroyInput?.checked;
      inputs.forEach(input => { input.disabled = !isNewTag && !isRemovedTag });
    }

    // stop form submission to allow dom updates to complete (disabled inputs), then submit if necessary
    formSubmission.stop();
    const inputsToSubmit = this.hiddenFieldTargets.filter(input => !input.disabled);
    if (inputsToSubmit.length) {
      setTimeout(() => {
        this.didSubmit = true;
        this.element.requestSubmit();
      });
    }
  }

  onTurboSubmitEnd(e: TurboSubmitEndEvent) {
    this.didSubmit = false;
  }
}