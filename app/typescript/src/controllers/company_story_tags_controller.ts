import FormController from "./form_controller";

export default class CompanyStoryTagsController extends FormController<CompanyStoryTagsController> {
  [key: string]: any; // allow computed property names

  static targets = [
    'categoryTagsInput', 
    'categoryTagNameInput',
    'productTagsInput', 
    'productTagNameInput',
  ];  
  declare readonly categoryTagsInputTarget: HTMLInputElement;
  declare categoryTagNameInputTargets: HTMLInputElement[];
  declare readonly productTagsInputTarget: HTMLInputElement;
  declare productTagNameInputTargets: HTMLInputElement[];

  connect() {
  }

  onChangeTags({ target: input }: { target: HTMLInputElement }) {
    // when focus is lost with new tag(s) entered e.target will be the new item input element instead of the main input element
    // input.tomselect.settings.createOnBlur is false, so in this case we can ignore the change event
    if (input.id.includes('ts-control')) return;
    const kind = input.dataset.tomselectKindValue!;
    const tagNames = input.value ? input.value.split(',') : [];
    const tagNameInputTargets = this[`${kind}TagNameInputTargets`];
    const tagWasAdded = (tagName: string) => (
      !tagNameInputTargets.map((input: HTMLInputElement) => input.value).includes(tagName)
    );
    const tagWasRemoved = (input: HTMLInputElement) => !tagNames.includes(input.value);
    const tagExists = (input: HTMLInputElement) => {
      const tagIdInput = <HTMLInputElement>input.previousElementSibling;
      return tagIdInput.value;
    }
    for (const tagName of tagNames) {
      if (tagWasAdded(tagName)) {
        this.element.insertAdjacentHTML('beforeend', this.newTagHiddenInputsTemplate(kind, tagName));
      }
    }
    for (const input of tagNameInputTargets) {
      if (tagWasRemoved(input)) {
        if (tagExists(input)) {
          input.nextElementSibling.checked = true;  // _destroy input
        } else {
          input.previousElementSibling.remove();
          input.remove();
        }
      }
    }
  }

  onAjaxComplete({ detail: [xhr, status] }: { detail: [xhr: XMLHttpRequest, status: string] }) {
    // super.onAjaxComplete({ detail: [xhr, status] });
    // console.log('subclass', xhr, status);
  }

  newTagHiddenInputsTemplate(kind: string, tagName: string) {
    const key = kind === 'category' ? 'story_categories_attributes' : 'products_attributes';
    const index = this[`${kind}TagNameInputTargets`].length;
    return `
      <input type="hidden" name="company[${key}][${index}][id]" id="company_${key}_${index}_id" value="">
      <input type="hidden" name="company[${key}][${index}][name]" id="company_${key}_${index}_name" value="${tagName}" data-company-story-tags-target="${kind}TagNameInput">
    `;
  }
}