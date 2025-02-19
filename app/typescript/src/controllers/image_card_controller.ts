import { Controller } from '@hotwired/stimulus';
import { initS3FileInput, onS3Done } from '../user_uploads';

export default class ImageCardController extends Controller<HTMLDivElement | HTMLLIElement> {
  static outlets = ['form', 'ads', 'company-profile'];
  declare readonly formOutlet: Controller;
  declare readonly hasFormOutlet: boolean;
  declare readonly adsOutlet: Controller;
  declare readonly hasAdsOutlet: boolean;
  declare readonly companyProfileOutlet: Controller;
  declare readonly hasCompanyProfileOutlet: boolean;

  static values = {
    kind: String,
    inputsEnabled: { type: Boolean, default: false },
    openFileDialog: { type: Boolean, default: false },
    toggleDefault: { type: Boolean, default: false }   // whether to make the image the default for that type
  }
  declare readonly kindValue: string;
  declare inputsEnabledValue: boolean;
  declare openFileDialogValue: boolean;
  declare toggleDefaultValue: boolean;

  static targets = [
    'formGroup', 
    'preview',
    'input',
    'idInput',
    'urlInput', 
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
  declare readonly defaultInputTarget: HTMLInputElement;
  declare readonly hasDefaultInputTarget: boolean;
  declare readonly _destroyInputTarget: HTMLInputElement;
  declare readonly fileInputTarget: HTMLInputElement;
  declare readonly adImageCheckboxTarget: HTMLInputElement;

  declare imageLoadTimer: number;

  changeFileInputHandler = this.onChangeFileInput.bind(this);
  clearFileInputHandler = this.onClearFileInput.bind(this);
  validateFileInputHandler = this.onValidateFileInput.bind(this);
  validFileInputHandler = this.onValidFileInput.bind(this);
  invalidFileInputHandler = this.onInvalidFileInput.bind(this);
  validatedFileInputHandler = this.onValidatedFileInput.bind(this);

  connect() {
    // jquery event listeners necessary for hooking into jquery plugin events
    if (this.fileUploadEnabled) {
      $(this.formGroupTarget)
        .on('change.bs.fileinput', this.changeFileInputHandler)
        .on('clear.bs.fileinput', this.clearFileInputHandler);

      // bootstrap validator events trigger on the form 
      if (this.parentFormOutlet) {
        $(this.parentFormOutlet.element)
          .on('validate.bs.validator', this.validateFileInputHandler)
          .on('valid.bs.validator', this.validFileInputHandler)
          .on('invalid.bs.validator', this.invalidFileInputHandler)
          .on('validated.bs.validator', this.validatedFileInputHandler);
      }
  
      if (this.fileInputTarget.hasAttribute('data-s3')) {
        initS3FileInput(this.fileInputTarget, onS3Done.bind(this));
      }
    }
  }
  
  disconnect() {
    if (this.fileUploadEnabled) {
      $(this.formGroupTarget)
        .off('change.bs.fileinput', this.changeFileInputHandler)
        .off('clear.bs.fileinput', this.clearFileInputHandler)
        
      // after disconnect, any outlets (e.g. the parent form) will be null
      $(this.element.closest('form'))
        .off('validate.bs.validator', this.validateFileInputHandler)
        .off('valid.bs.validator', this.validFileInputHandler)
        .off('invalid.bs.validator', this.invalidFileInputHandler)
        .off('validated.bs.validator', this.validatedFileInputHandler);
    }
  }

  onChangeFileInput() {
    if (!this.imageDidLoad()) {
      this.imageLoadTimer = window.setInterval(this.imageDidLoad.bind(this), 100);
    }
  }

  imageDidLoad() {
    if (this.imgTarget?.complete) {
      console.log('image did load')
      window.clearInterval(this.imageLoadTimer);
      this.fileInputTarget.setAttribute('data-validate', 'true');
      this.dispatch('image-ready', { detail: { shouldValidate: true } });
      return true;
    }
  }

  onClearFileInput(e: CustomEvent) {
    console.log('clear.bs.fileinput')
    this.element.classList.toggle('hidden', this.hasAdsOutlet && !this.isDefaultImage);    
    this.fileInputTarget.setAttribute('data-validate', 'false');
    this.dispatch('clear-fileinput');
  }

  onValidateFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    console.log('validate.bs.validator')
    if (input === this.fileInputTarget) {
      // console.log('validate.bs.validator')
    }
  }
  
  onValidFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget) {
      console.log('valid.bs.validator')
      if (this.isDefaultImage && this.hasIdInputTarget) {
        this.dispatch('replace-default', { detail: { prevDefaultImageId: this.idInputTarget.value } });
        this.idInputTarget.value = '';
      }
      this.element.classList.add('image-card--uploading');
      $(input).fileupload('send', { files: input.files });
    }
  }
  
  onInvalidFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget) {
      console.log('invalid.bs.validator')
    }
  }
  
  onValidatedFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget && !this.isDefaultImage) {
      console.log('validated.bs.validator')
      if (this.element.classList.contains('hidden')) this.element.classList.remove('hidden');
    }
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
  
  toggleDefaultValueChanged(newVal: boolean, oldVal: boolean) {
    if (oldVal === undefined || !this.hasDefaultInputTarget) return;
    this.defaultInputTarget.value = newVal.toString();
    if (!this.isDefaultImage) this.formGroupTarget.classList.toggle('to-be-default', newVal);
  }

  deleteImage() {
    this._destroyInputTarget.value = 'true';
    this.inputsEnabledValue = true;
    this.formGroupTarget.classList.add('to-be-removed');
  }

  saveChanges({ target: btn }: { target: HTMLButtonElement }) {
    this.dispatch('save-changes', { detail: { card: this.element, userAction: btn.dataset.userAction } });
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
      { detail: { card: this.element, kind: this.kindValue, toggleDefault: this.toggleDefaultValue } }
    );
  }

  toggleSelected({ currentTarget: card }: { currentTarget: HTMLLIElement }) {
    card.classList.toggle('selected');
    this.adImageCheckboxTarget.checked = !this.adImageCheckboxTarget.checked;
  }

  openFileDialogValueChanged(newVal: boolean) {
    if (newVal) {
      this.fileInputTarget.click();
      this.openFileDialogValue = false;
    }
  } 

  get isDefaultImage() {
    // return this.element.className.includes('--default');
    return this.element.classList.contains('gads-default');
  }

  // jasny-bootstrap will remove and replace the img tag when uploading
  get imgTarget() {
    return <HTMLImageElement>this.previewTarget.querySelector(':scope > img');
  }

  get fileUploadEnabled() {
    return this.hasFormGroupTarget;
  }

  get parentFormOutlet() {
    if (this.hasFormOutlet) return this.formOutlet;
    if (this.hasAdsOutlet) return this.adsOutlet;
    if (this.hasCompanyProfileOutlet) return this.companyProfileOutlet;
  }
}
