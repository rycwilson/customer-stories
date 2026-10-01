import { Controller } from '@hotwired/stimulus';
import { initS3FileInput, validateImage, onS3Done } from '../user_uploads';

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
    'fileInputWidget', 
    'preview',
    'input',
    'idInput',
    'urlInput',
    'typeInput', 
    'defaultInput',
    '_destroyInput',
    'fileInput', 
    'adImageCheckbox',
    'helpBlock',
  ];
  declare readonly formGroupTarget: HTMLDivElement;
  declare readonly fileInputWidgetTarget: HTMLDivElement;
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
  declare readonly helpBlockTarget: HTMLDivElement;

  changeFileInputHandler = this.onChangeFileInput.bind(this);

  // jasny-bootstrap will replace the img tag when uploading
  get imgTarget() {
    return this.previewTarget.querySelector<HTMLImageElement>(':scope > img');
  }

  get isDefaultImage() {
    // return this.element.className.includes('--default');
    return this.element.classList.contains('gads-default');
  }

  connect() {
    // jquery event listeners necessary for hooking into jquery plugin events
    if (this.uploadEnabledValue) {
      $(this.fileInputWidgetTarget)
        .fileinput({ name: 'user[photo_filename]' })
        .on('change.bs.fileinput', this.changeFileInputHandler);
        // .on('reseted.bs.fileinput', this.resetFileInputHandler);
        // .on('clear.bs.fileinput', this.clearFileInputHandler);
  
      initS3FileInput(this.fileInputTarget, onS3Done.bind(this));
    }

    if (this.element.dataset.userProfileTarget) {
      const userPhoto = <HTMLElement>document.getElementById('user-photo');
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          console.log(mutation)
          if (mutation.type === 'attributes') {
            console.log('old classname:', mutation.oldValue);
            console.log('new classname:', (<HTMLElement>mutation.target).className)
          } else if (mutation.type === 'childList') {
            if (mutation.addedNodes.length) console.log('added nodes:', mutation.addedNodes);
            if (mutation.removedNodes.length) console.log('removed nodes:', mutation.removedNodes);
          }
        });
        observer.observe(userPhoto, { childList: true, subtree: true });
        observer.observe(this.formGroupTarget, { attributes: true, attributeOldValue: true });
        observer.observe(this.fileInputWidgetTarget, { attributes: true, attributeOldValue: true });
      });
    }
  }
  
  disconnect() {
    if (this.uploadEnabledValue) {
      $(this.fileInputWidgetTarget)
        .off('change.bs.fileinput', this.changeFileInputHandler)
        // .off('reseted.bs.fileinput', this.resetFileInputHandler)
        // .off('clear.bs.fileinput', this.clearFileInputHandler)
    }
  }

  onChangeFileInput(_e: Event, file: File) {
    let loadTimer: number | undefined;
    const imageDidLoad = (img: HTMLImageElement) => {
      if (img.complete) {
        if (loadTimer) clearInterval(loadTimer);
        return true;
      }
    }
    const beforeUpload = () => {
      const img = this.imgTarget as HTMLImageElement;
      if (!img) return;

      if (imageDidLoad(img)) {
        validateImage(this.fileInputTarget, file, img);
        if (this.fileInputTarget.checkValidity()) this.uploadFile();
        return;
      } else {
        // const errorTimeout = setTimeout(() => console.log('something wrong?'), 5000)
        loadTimer = window.setInterval(imageDidLoad, 100);
      }
    }

    // Defer the handler to ensure fileinput widget has completed its DOM updates
    setTimeout(beforeUpload.bind(this));
  }

  uploadFile() {
    const input = this.fileInputTarget;
    const imageType: string | undefined = input.dataset.imageType;
    const isDefaultReplacement = this.isDefaultImage && this.hasIdInputTarget
    this.element.classList.toggle(`image-card--${input.dataset.imageType}`, !!imageType)
    this.element.classList.add('image-card--uploading');
    this.element.classList.remove('hidden');
    if (imageType && this.hasTypeInputTarget) {
      this.typeInputTarget.value = imageType;
    }
    if (isDefaultReplacement) {
      this.dispatch('replace-default', { detail: { prevDefaultImageId: this.idInputTarget.value } });
      this.idInputTarget.value = '';
    }
    $(input).fileupload('send', { files: input.files });
  }
  
  onInvalidImage() {
    // $(this.fileInputWidgetTarget).fileinput('reset');
    this.formGroupTarget.classList.add('has-error', 'has-error--validation');
    this.helpBlockTarget.textContent = this.fileInputTarget.validationMessage;
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
