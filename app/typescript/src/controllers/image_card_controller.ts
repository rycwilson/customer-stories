import { Controller } from '@hotwired/stimulus';

export default class ImageCardController extends Controller<HTMLLIElement> {
  static values = {
    toggleDefault: { type: Boolean, default: false },   // whether the defaultCheckbox should be checked
    kind: String,
  }
  declare toggleDefaultValue: boolean;
  declare readonly kindValue: string;

  static targets = ['formGroup', 'defaultCheckbox', '_destroyCheckbox'];
  declare readonly formGroupTarget: HTMLDivElement;
  declare readonly defaultCheckboxTarget: HTMLInputElement;
  declare readonly _destroyCheckboxTarget: HTMLInputElement;

  makeDefault() {
    this.toggleDefaultValue = true;
    this.dispatchMakeDefaultEvent();
  }
  
  toggleDefaultValueChanged(newVal: boolean, oldVal: boolean) {
    console.log(`toggleDefaultValueChanged(${newVal}, ${oldVal})`);
    if (oldVal === undefined) return;
    this.defaultCheckboxTarget.checked = newVal;
    if (!this.isDefault) this.formGroupTarget.classList.toggle('to-be-default', newVal);
  }

  deleteImage() {
    this._destroyCheckboxTarget.checked = true;
    this.formGroupTarget.classList.add('to-be-removed');
  }

  cancelAction() {
    if (this.toggleDefaultValue) {
      this.toggleDefaultValue = false;
      this.dispatchMakeDefaultEvent();
    } else {
      this._destroyCheckboxTarget.checked = false;
    }
    this.formGroupTarget.classList.remove('to-be-default', 'to-be-removed');
  }

  dispatchMakeDefaultEvent() {
    this.dispatch(
      'make-default', 
      { detail: { card: this.element, kind: this.kindValue, toggleDefault: this.toggleDefaultValue } }
    );
  }

  get isDefault() {
    return this.element.classList.contains('gads-default');
  }
}
