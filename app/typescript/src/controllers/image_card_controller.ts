import { Controller } from '@hotwired/stimulus';
import AdsController from './ads_controller';
import { initS3FileInput, onS3Done } from '../user_uploads';

export default class ImageCardController extends Controller<HTMLLIElement> {
  static outlets = ['ads'];
  declare readonly adsOutlet: AdsController;
  declare readonly hasAdsOutlet: boolean;

  static values = {
    kind: String,
    imageId: Number,
    openFileDialog: { type: Boolean, default: false },
    toggleDefault: { type: Boolean, default: false }   // whether to make the image the default for that type
  }
  declare readonly kindValue: string;
  declare readonly imageIdValue: number;
  declare openFileDialogValue: boolean;
  declare toggleDefaultValue: boolean;

  static targets = [
    'formGroup', 
    // 'imgWrapper', 
    'preview',
    'idInput',
    'imageUrlInput', 
    'defaultInput',
    '_destroyInput',
    'fileInput', 
    'adImageCheckbox', 
  ];
  declare readonly formGroupTarget: HTMLDivElement;
  declare readonly previewTarget: HTMLDivElement;
  declare readonly idInputTarget: HTMLInputElement;
  declare readonly hasIdInputTarget: boolean;
  declare readonly imageUrlInputTarget: HTMLInputElement;
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
    $(this.formGroupTarget)
      .on('change.bs.fileinput', this.changeFileInputHandler)
      .on('clear.bs.fileinput', this.clearFileInputHandler);

    // bootstrap validator events trigger on the form 
    if (this.hasAdsOutlet) {
      $(this.adsOutlet.element)
        .on('validate.bs.validator', this.validateFileInputHandler)
        .on('valid.bs.validator', this.validFileInputHandler)
        .on('invalid.bs.validator', this.invalidFileInputHandler)
        .on('validated.bs.validator', this.validatedFileInputHandler);
    }

    if (this.fileInputTarget.hasAttribute('data-s3')) {
      initS3FileInput(this.fileInputTarget, onS3Done.bind(this));
    }
  }
  
  disconnect() {
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

  onChangeFileInput({ target }: { target: HTMLElement }) {
    if (!this.imageDidLoad()) {
      this.imageLoadTimer = window.setInterval(this.imageDidLoad.bind(this), 100);
    }
    // if (target === this.formGroupTarget) {
    //   if (!this.imageDidLoad()) {
    //     this.imageLoadTimer = window.setInterval(this.imageDidLoad.bind(this), 100);
    //   }
    // } else {
    //   console.log('is there another?', target)
    // }
  }

  imageDidLoad() {
    if (this.imgTarget?.complete) {
      window.clearInterval(this.imageLoadTimer);
      console.log('image did load')
      this.fileInputTarget.setAttribute('data-validate', 'true');
      this.dispatch('image-ready', { detail: { shouldValidate: true } });
      return true;
    }
  }

  onClearFileInput(e: CustomEvent) {
    console.log('clear.bs.fileinput')
    this.element.classList.toggle('hidden', !this.isDefaultImage);    
    this.fileInputTarget.setAttribute('data-validate', 'false');
    this.dispatch('clear-fileinput');
  }

  onValidateFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget) {
      console.log('validate.bs.validator')
    }
  }
  
  onValidFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget && input.value) {
      console.log('valid.bs.validator, uploading file:', input.files)
      if (this.isDefaultImage && this.hasIdInputTarget) {
        this.dispatch('replace-default', { detail: { prevDefaultImageId: this.idInputTarget.value } });
        this.idInputTarget.value = '';
      }
      this.element.classList.add('image-card--uploading');
      $(input).fileupload('send', { files: input.files });
    } else if (input === this.fileInputTarget) {
      console.log('valid.bs.validator, but no file?')
    }
  }
  
  onInvalidFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget && input.value) {
      console.log('invalid.bs.validator')
    } else if (input === this.fileInputTarget) {
      console.log('invalid.bs.validator, but no file?')
    }
  }
  
  onValidatedFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget && !this.isDefaultImage) {
      console.log('validated.bs.validator')
      this.element.classList.remove('hidden');
    }
  }

  makeDefault() {
    this.toggleDefaultValue = true;
    this.dispatchMakeDefaultEvent();
  }
  
  toggleDefaultValueChanged(newVal: boolean, oldVal: boolean) {
    if (oldVal === undefined || !this.hasDefaultInputTarget) return;
    // this.defaultImageCheckboxTarget.checked = newVal;
    this.defaultInputTarget.value = newVal.toString();
    if (!this.isDefaultImage) this.formGroupTarget.classList.toggle('to-be-default', newVal);
  }

  deleteImage() {
    this._destroyInputTarget.value = 'true';
    this.formGroupTarget.classList.add('to-be-removed');
  }

  saveChanges({ target: btn }: { target: HTMLButtonElement }) {
    this.dispatch(
      'save-changes',
      { detail: { card: this.element, userAction: btn.dataset.userAction, imageId: this.imageIdValue } }
    );
  }

  cancelChanges() {
    if (this.toggleDefaultValue) {
      this.toggleDefaultValue = false;
      this.dispatchMakeDefaultEvent();
    } else {
      this._destroyInputTarget.value = 'false';
    }
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
}
