import { Controller } from '@hotwired/stimulus';
import { type SubclassController } from './form_controller';
import { initS3FileInput, onS3Done } from '../user_uploads';

export default class ImageCardController extends Controller<HTMLDivElement | HTMLLIElement> {
  static outlets = ['form', 'ads', 'user-profile','company-profile', 'story-settings'];
  declare readonly formOutlet: Controller;
  declare readonly hasFormOutlet: boolean;
  declare readonly adsOutlet: Controller;
  declare readonly hasAdsOutlet: boolean;
  declare readonly userProfileOutlet: Controller;
  declare readonly hasUserProfileOutlet: boolean;
  declare readonly companyProfileOutlet: Controller;
  declare readonly hasCompanyProfileOutlet: boolean;
  declare readonly storySettingsOutlet: Controller;
  declare readonly hasStorySettingsOutlet: boolean;

  static values = {
    inputsEnabled: { type: Boolean, default: false },
    openFileDialog: { type: Boolean, default: false },
    toggleDefault: { type: Boolean, default: false }   // whether to make the image the default for that type
  }
  declare inputsEnabledValue: boolean;
  declare openFileDialogValue: boolean;
  declare toggleDefaultValue: boolean;

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
  // clearFileInputHandler = this.onClearFileInput.bind(this);
  // resetFileInputHandler = this.onResetFileInput.bind(this);
  validateFileInputHandler = this.onValidateFileInput.bind(this);
  validFileInputHandler = this.onValidFileInput.bind(this);
  invalidFileInputHandler = this.onInvalidFileInput.bind(this);
  validatedFileInputHandler = this.onValidatedFileInput.bind(this);

  // jasny-bootstrap will remove and replace the img tag when uploading
  get imgTarget() {
    return <HTMLImageElement>this.previewTarget.querySelector(':scope > img');
  }

  get isDefaultImage() {
    // return this.element.className.includes('--default');
    return this.element.classList.contains('gads-default');
  }

  get fileUploadEnabled() {
    return this.hasFormGroupTarget;
  }

  get parentFormOutlet() {
    if (this.hasFormOutlet) return this.formOutlet;
    if (this.hasAdsOutlet) return this.adsOutlet;
    if (this.hasUserProfileOutlet) return this.userProfileOutlet;
    if (this.hasCompanyProfileOutlet) return this.companyProfileOutlet;
    if (this.hasStorySettingsOutlet) return this.storySettingsOutlet;
  }

  connect() {
    // jquery event listeners necessary for hooking into jquery plugin events
    if (this.fileUploadEnabled) {
      $(this.formGroupTarget)
        .on('change.bs.fileinput', this.changeFileInputHandler)
        // .on('reseted.bs.fileinput', this.resetFileInputHandler);
        // .on('clear.bs.fileinput', this.clearFileInputHandler);
  
      if (this.fileInputTarget.hasAttribute('data-s3')) {
        initS3FileInput(this.fileInputTarget, onS3Done.bind(this));
      }
    }
  }
  
  disconnect() {
    if (this.fileUploadEnabled) {
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
      console.log('image did load')
      clearInterval(this.imageLoadTimer);

      // set dimensions for validation
      this.fileInputTarget.setAttribute('data-width', this.imgTarget.naturalWidth.toString());
      this.fileInputTarget.setAttribute('data-height', this.imgTarget.naturalHeight.toString());
      this.dispatch('ready-to-validate', { detail: { fileInput: this.fileInputTarget } });
      return true;
    }
  }

  onValidateFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget) {
      console.log('validate.bs.validator')
    }
  }
  
  onValidFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget) {
      console.log('valid.bs.validator')
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
  }
  
  onInvalidFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget) {
      console.log('invalid.bs.validator')
      if (this.parentFormOutlet) {
        (<HTMLFormElement>this.parentFormOutlet.element).reset();
      }
      $(this.formGroupTarget).fileinput('reset');
    }
  }
  
  onValidatedFileInput(e: any) {
    const input = e.relatedTarget;
    if (input === this.fileInputTarget) {
      console.log('validated.bs.validator')
      this.dispatch('validated', { detail: { fileInput: input } });
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

  formOutletConnected(_: SubclassController, form: HTMLFormElement) {
    this.addValidationListeners(form);
  }

  formOutletDisconnected(_: SubclassController, form: HTMLFormElement) {
    this.removeValidationListeners(form);
  }

  adsOutletConnected(_: SubclassController, form: HTMLFormElement) {
    this.addValidationListeners(form);
  }

  adsOutletDisconnected(_: SubclassController, form: HTMLFormElement) {
    this.removeValidationListeners(form);
  }

  userProfileOutletConnected(_: SubclassController, form: HTMLFormElement) {
    this.addValidationListeners(form);
  }

  userProfileOutletDisconnected(_: SubclassController, form: HTMLFormElement) {
    this.removeValidationListeners(form);
  }

  companyProfileOutletConnected(_: SubclassController, form: HTMLFormElement) {
    this.addValidationListeners(form);
  }

  companyProfileOutletDisconnected(_: SubclassController, form: HTMLFormElement) {
    this.removeValidationListeners(form);
  }

  storySettingsOutletConnected(_: SubclassController, form: HTMLFormElement) {
    this.addValidationListeners(form);
  }

  storySettingsOutletDisconnected(_: SubclassController, form: HTMLFormElement) {
    this.removeValidationListeners(form);
  }

  // Bootstrap Validator events trigger on the form
  private addValidationListeners(formElement: HTMLFormElement) {
    $(formElement)
      .on('validate.bs.validator', this.validateFileInputHandler)
      .on('valid.bs.validator', this.validFileInputHandler)
      .on('invalid.bs.validator', this.invalidFileInputHandler)
      .on('validated.bs.validator', this.validatedFileInputHandler);
  }

  private removeValidationListeners(formElement: HTMLFormElement) {
    $(formElement)
      .off('validate.bs.validator', this.validateFileInputHandler)
      .off('valid.bs.validator', this.validFileInputHandler)
      .off('invalid.bs.validator', this.invalidFileInputHandler)
      .off('validated.bs.validator', this.validatedFileInputHandler);
  }
}
