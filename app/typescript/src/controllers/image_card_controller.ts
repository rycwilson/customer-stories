import { Controller } from '@hotwired/stimulus';

export default class ImageCardController extends Controller<HTMLLIElement> {
  static values = {
    toggleDefault: { type: Boolean, default: false },   // whether the defaultImageCheckbox should be checked
    kind: String,
    imageId: Number,
  }
  declare toggleDefaultValue: boolean;
  declare readonly kindValue: string;
  declare readonly imageIdValue: number

  static targets = ['formGroup', 'adImageCheckbox', 'defaultImageCheckbox', '_destroyImageCheckbox'];
  declare readonly formGroupTarget: HTMLDivElement;
  declare readonly adImageCheckboxTarget: HTMLInputElement;
  declare readonly defaultImageCheckboxTarget: HTMLInputElement;
  declare readonly _destroyImageCheckboxTarget: HTMLInputElement;

  makeDefault() {
    this.toggleDefaultValue = true;
    this.dispatchMakeDefaultEvent();
  }
  
  toggleDefaultValueChanged(newVal: boolean, oldVal: boolean) {
    // console.log(`toggleDefaultValueChanged(${newVal}, ${oldVal})`);˝˝
    if (oldVal === undefined) return;
    this.defaultImageCheckboxTarget.checked = newVal;
    if (!this.isDefault) this.formGroupTarget.classList.toggle('to-be-default', newVal);
  }

  deleteImage() {
    this._destroyImageCheckboxTarget.checked = true;
    this.formGroupTarget.classList.add('to-be-removed');
  }

  cancelAction() {
    if (this.toggleDefaultValue) {
      this.toggleDefaultValue = false;
      this.dispatchMakeDefaultEvent();
    } else {
      this._destroyImageCheckboxTarget.checked = false;
    }
    this.formGroupTarget.classList.remove('to-be-default', 'to-be-removed');
  }

  dispatchMakeDefaultEvent() {
    this.dispatch(
      'make-default', 
      { detail: { card: this.element, kind: this.kindValue, toggleDefault: this.toggleDefaultValue } }
    );
  }

  submitForm({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
    this.dispatch(
      'submit-form', 
      { detail: { card: this.element, imageId: this.imageIdValue, action: btn.dataset.submitAction } }
    );
  }

  toggleSelected({ currentTarget: card }: { currentTarget: HTMLLIElement }) {
    card.classList.toggle('selected');
    this.adImageCheckboxTarget.checked = !this.adImageCheckboxTarget.checked;
  }

  get isDefault() {
    return this.element.classList.contains('gads-default');
  }
}
