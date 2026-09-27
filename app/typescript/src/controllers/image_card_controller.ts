import { Controller } from '@hotwired/stimulus';
import { initS3FileInput, onS3Done } from '../user_uploads';

export default class ImageCardController extends Controller<HTMLDivElement | HTMLLIElement> {
  static values = {
    inputsEnabled: { type: Boolean, default: false },
    openFileDialog: { type: Boolean, default: false },
    toggleDefault: { type: Boolean, default: false },   // whether to make the image the default for that type
    uploadEnabled: Boolean,
  }
  declare inputsEnabledValue: boolean;
  declare openFileDialogValue: boolean;
  declare toggleDefaultValue: boolean;
  declare readonly uploadEnabledValue: boolean;

  static targets = [
    'formGroup', 
    'preview',
    'input',
    'idInput',
    'urlInput',
    'typeInput', 
    'defaultInput',
    '_destroyInput',
    'fileInput', 
    'adImageCheckbox',
  ];
  declare readonly formGroupTarget: HTMLDivElement;
  declare readonly hasFormGroupTarget: boolean;
  declare readonly previewTarget: HTMLDivElement;
  declare readonly inputTargets: HTMLInputElement[];
  declare readonly idInputTarget: HTMLInputElement;
  declare readonly hasIdInputTarget: boolean;
  declare readonly urlInputTarget: HTMLInputElement;
  declare readonly typeInputTarget: HTMLInputElement;
  declare readonly hasTypeInputTarget: boolean;
  declare readonly defaultInputTarget: HTMLInputElement;
  declare readonly hasDefaultInputTarget: boolean;
  declare readonly _destroyInputTarget: HTMLInputElement;
  declare readonly fileInputTarget: HTMLInputElement;
  declare readonly adImageCheckboxTarget: HTMLInputElement;

  declare imageLoadTimer: number;

  changeFileInputHandler = this.onChangeFileInput.bind(this);

  // jasny-bootstrap will remove and replace the img tag when uploading
  get imgTarget() {
    return <HTMLImageElement>this.previewTarget.querySelector(':scope > img');
  }

  get isDefaultImage() {
    // return this.element.className.includes('--default');
    return this.element.classList.contains('gads-default');
  }

  get validatorHandlers() {
    return {
      'validate.bs.validator': this.onValidateFileInput.bind(this),
      'valid.bs.validator': this.onValidFileInput.bind(this),
      'invalid.bs.validator': this.onInvalidFileInput.bind(this),
      'validated.bs.validator': this.onValidatedFileInput.bind(this),
    };
  }

  connect() {
    // jquery event listeners necessary for hooking into jquery plugin events
    if (this.uploadEnabledValue) {
      $(this.formGroupTarget)
        .on('change.bs.fileinput', this.changeFileInputHandler)
        // .on('reseted.bs.fileinput', this.resetFileInputHandler);
        // .on('clear.bs.fileinput', this.clearFileInputHandler);
  
      if (this.fileInputTarget.hasAttribute('data-s3')) {
        initS3FileInput(this.fileInputTarget, onS3Done.bind(this));
      }
    }

    setTimeout(() => {
      this.dispatch(
        'ready-for-validator', 
        { detail: { input: this.fileInputTarget, handlers: this.validatorHandlers } }
      )
    });
  }
  
  disconnect() {
    if (this.uploadEnabledValue) {
      $(this.formGroupTarget)
        .off('change.bs.fileinput', this.changeFileInputHandler)
        // .off('reseted.bs.fileinput', this.resetFileInputHandler)
        // .off('clear.bs.fileinput', this.clearFileInputHandler)
    }
  }

  onChangeFileInput() {
    console.log('change.bs.fileinput')
    if (!this.imageDidLoad()) {
      this.imageLoadTimer = window.setInterval(this.imageDidLoad.bind(this), 100);
    }
  }

  imageDidLoad() {
    if (this.imgTarget?.complete) {
      // console.log('image did load')
      clearInterval(this.imageLoadTimer);

      // set dimensions for validation
      this.fileInputTarget.setAttribute('data-width', this.imgTarget.naturalWidth.toString());
      this.fileInputTarget.setAttribute('data-height', this.imgTarget.naturalHeight.toString());
      this.dispatch('ready-to-validate', { detail: { fileInput: this.fileInputTarget } });
      return true;
    }
  }

  onValidateFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input !== this.fileInputTarget) return;

    // console.log('validate.bs.validator')
  }
  
  onValidFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input !== this.fileInputTarget) return;
    
    // console.log('valid.bs.validator')
    const imageType = <string>input.dataset.imageType;
    const isDefaultReplacement = this.isDefaultImage && this.hasIdInputTarget
    this.element.classList.add(`image-card--${input.dataset.imageType}`, 'image-card--uploading');
    this.element.classList.remove('hidden');
    if (this.hasTypeInputTarget) {
      this.typeInputTarget.value = imageType;
    }
    if (isDefaultReplacement) {
      this.dispatch('replace-default', { detail: { prevDefaultImageId: this.idInputTarget.value } });
      this.idInputTarget.value = '';
    }
    $(input).fileupload('send', { files: input.files });
  }
  
  onInvalidFileInput(
    { relatedTarget: input, detail: errors }: 
    { relatedTarget: HTMLInputElement, detail: string[] }
  ) {
    if (input !== this.fileInputTarget) return;

    console.log('invalid.bs.validator')
    this.dispatch('invalid');
    $(this.formGroupTarget).fileinput('reset');
  }
  
  onValidatedFileInput(e: { type: 'validated'; [key: string]: unknown }) {
    const input = e.relatedTarget;
    if (input !== this.fileInputTarget) return;
    
    // console.log('validated.bs.validator')
    this.dispatch('validated', { detail: { fileInput: input } });
  }

  makeDefault() {
    this.toggleDefaultValue = true;
    this.inputsEnabledValue = true;
    this.dispatchMakeDefaultEvent();
  }

  inputsEnabledValueChanged(shouldEnable: boolean, wasEnabled: boolean) {
    if (shouldEnable === wasEnabled || wasEnabled === undefined) return;
    this.inputTargets.forEach((input: HTMLInputElement) => input.disabled = !shouldEnable);
  }
  
  toggleDefaultValueChanged(shouldToggleOn: boolean, wasToggledOn: boolean) {
    if (wasToggledOn === undefined || !this.hasDefaultInputTarget) return;
    this.defaultInputTarget.value = shouldToggleOn.toString();
    if (!this.isDefaultImage) this.formGroupTarget.classList.toggle('to-be-default', shouldToggleOn);
  }

  deleteImage() {
    this._destroyInputTarget.value = 'true';
    this.inputsEnabledValue = true;
    this.formGroupTarget.classList.add('to-be-removed');
  }

  cancelChanges() {
    if (this.toggleDefaultValue) {
      this.toggleDefaultValue = false;
      this.dispatchMakeDefaultEvent();
    } else {
      this._destroyInputTarget.value = 'false';
    }
    this.inputsEnabledValue = false;
    this.formGroupTarget.classList.remove('to-be-default', 'to-be-removed');
  }

  dispatchMakeDefaultEvent() {
    this.dispatch(
      'make-default', 
      { detail: { card: this.element, imageType: this.fileInputTarget.dataset.imageType, toggleDefault: this.toggleDefaultValue } }
    );
  }

  toggleSelected({ currentTarget: card }: { currentTarget: HTMLLIElement }) {
    card.classList.toggle('selected');
    this.adImageCheckboxTarget.checked = !this.adImageCheckboxTarget.checked;
  }

  openFileDialogValueChanged(shouldOpen: boolean) {
    if (shouldOpen) {
      this.fileInputTarget.click();
      this.openFileDialogValue = false;
    }
  } 
}
