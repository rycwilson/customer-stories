import { Controller } from '@hotwired/stimulus';
import AdsController from './ads_controller';
import CompanyProfileController from './company_profile_controller';
import { initS3FileInput, onS3Done } from '../user_uploads';

export default class ImageCardController extends Controller<HTMLLIElement> {
  static outlets = ['ads', 'company-profile'];
  declare readonly adsOutlet: AdsController;
  declare readonly hasAdsOutlet: boolean;
  declare readonly companyProfileOutlet: CompanyProfileController;
  declare readonly hasCompanyProfileOutlet: boolean;

  static values = {
    kind: String,
    enableInputs: { type: Boolean, default: false },
    openFileDialog: { type: Boolean, default: false },
    toggleDefault: { type: Boolean, default: false }   // whether to make the image the default for that type
  }
  declare readonly kindValue: string;
  declare enableInputsValue: boolean;
  declare openFileDialogValue: boolean;
  declare toggleDefaultValue: boolean;

  static targets = [
    'formGroup', 
    'preview',
    'input',
    'idInput',
    'imageUrlInput', 
    'defaultInput',
    '_destroyInput',
    'fileInput', 
    'adImageCheckbox',
    'companySquareLogoUrlInput',
    'companyLandscapeLogoUrlInput',
  ];
  declare readonly formGroupTarget: HTMLDivElement;
  declare readonly hasFormGroupTarget: boolean;
  declare readonly previewTarget: HTMLDivElement;
  declare readonly inputTargets: HTMLInputElement[];
  declare readonly idInputTarget: HTMLInputElement;
  declare readonly hasIdInputTarget: boolean;
  declare readonly imageUrlInputTarget: HTMLInputElement;
  declare readonly defaultInputTarget: HTMLInputElement;
  declare readonly hasDefaultInputTarget: boolean;
  declare readonly _destroyInputTarget: HTMLInputElement;
  declare readonly fileInputTarget: HTMLInputElement;
  declare readonly adImageCheckboxTarget: HTMLInputElement;
  declare readonly companySquareLogoUrlInputTarget: HTMLInputElement;
  declare readonly hasCompanySquareLogoUrlInputTarget: boolean;
  declare readonly companyLandscapeLogoUrlInputTarget: HTMLInputElement;
  declare readonly hasCompanyLandscapeLogoUrlInputTarget: boolean

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
      if (this.formOutlet) {
        $(this.formOutlet.element)
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
      window.clearInterval(this.imageLoadTimer);
      console.log('image did load')
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
    if (input === this.fileInputTarget) {
      console.log('validate.bs.validator')
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
      this.element.classList.remove('hidden');
    }
  }

  makeDefault() {
    this.toggleDefaultValue = true;
    this.enableInputsValue = true;
    this.dispatchMakeDefaultEvent();
  }

  enableInputsValueChanged(shouldEnable: boolean, wasEnabled: boolean) {
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
    this.enableInputsValue = true;
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
    this.enableInputsValue = false;
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

  get formOutlet() {
    return this.hasAdsOutlet ? this.adsOutlet : (this.hasCompanyProfileOutlet ? this.companyProfileOutlet : null);
  }
}
