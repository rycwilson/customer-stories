import FormController from "./form_controller";

export default class CompanyTagsController extends FormController<CompanyTagsController> {
  static targets = [...FormController.targets, 'tagInput', 'newTagInput'];  
  declare tagInputTargets: HTMLInputElement[];
  declare newTagInputTargets: HTMLInputElement[];

  onAddTag(e: CustomEvent<{ item: HTMLElement, cancel?: boolean }>) {
    const { item, cancel = false } = e.detail;
    const tagName = item.dataset.value;
    if (cancel) {
      this.newTagInputTargets.find(input => input.dataset.itemId === item.id)!.parentElement!.remove();
    } else {
      const i = (this.tagInputTargets.length / 2) + this.newTagInputTargets.length;
      this.element.insertAdjacentHTML('beforeend', `
        <input
          type="hidden"
          name="company[${item.dataset.source}_attributes][${i}][name]"
          value="${tagName}"
          data-item-id="${item.id}"
          data-company-tags-target="newTagInput" />
      `);
    }

    this.updateState();
  }

  onRemoveTag(e: CustomEvent<{ item: HTMLElement, cancel: boolean }>) {
    const { item, cancel } = e.detail;
    const tagName = item.dataset.value;
    const inputs = this.tagInputTargets.filter(input => input.dataset.tagName === tagName);
    inputs.forEach(input => { input.disabled = cancel });

    this.updateState();
  }
}