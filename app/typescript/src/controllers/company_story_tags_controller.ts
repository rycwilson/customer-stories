import { TurboSubmitStartEvent } from "@hotwired/turbo";
import FormController from "./form_controller";

export default class CompanyStoryTagsController extends FormController<CompanyStoryTagsController> {
  static targets = ['hiddenField'];  
  declare hiddenFieldTargets: HTMLInputElement[];

  private wasProgrammaticallySubmitted = false;

  // connect() {
  // }

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
    if (this.wasProgrammaticallySubmitted) {
      this.wasProgrammaticallySubmitted = false;
      return;
    }

    const { formSubmission } = e.detail;

    // we want to identify inputs that are not related to a new or removed tag and disable them, as this avoids unnecessary updates
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
      const isRemovedTag = _destroyInput?.checked === true;
      if (!isNewTag && !isRemovedTag) {
        inputs.forEach(input => input.disabled = true);
      }
    }

    // stop form submission to allow for dom updates (disabled inputs) to complete, then submit programmatically
    formSubmission.stop();
    setTimeout(() => {
      this.wasProgrammaticallySubmitted = true;
      this.element.requestSubmit()
    });
  }
}