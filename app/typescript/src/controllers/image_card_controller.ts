import { Controller } from '@hotwired/stimulus';
import { initS3FileInput, validateImage, onS3Done } from '../user_uploads';

export default class ImageCardController extends Controller<HTMLDivElement | HTMLLIElement> {
  static values = {
    inputsEnabled: { type: Boolean, default: false },
    openFileDialog: { type: Boolean, default: false },
  }
  declare inputsEnabledValue: boolean;
  declare openFileDialogValue: boolean;

  static targets = [
    'formGroup',
    'fileInputWidget', 
    'preview',
    'input',
    'typeInput', 
    'urlInput',
    'fileInput', 
    'helpBlock',
  ];
  declare readonly formGroupTarget: HTMLDivElement;
  declare readonly fileInputWidgetTarget: HTMLDivElement;
  declare readonly hasFileInputWidgetTarget: boolean;
  declare readonly previewTarget: HTMLDivElement;
  declare readonly inputTargets: HTMLInputElement[];
  declare readonly urlInputTarget: HTMLInputElement;
  declare readonly typeInputTarget: HTMLInputElement;
  declare readonly hasTypeInputTarget: boolean;
  declare readonly fileInputTarget: HTMLInputElement;
  declare readonly helpBlockTarget: HTMLDivElement;

  changeFileInputHandler = this.onChangeFileInput.bind(this);

  // jasny-bootstrap will replace the img tag when uploading
  get imgTarget() {
    return this.previewTarget.querySelector<HTMLImageElement>(':scope > img');
  }

  connect() {
    // jquery event listeners necessary for hooking into jquery plugin events
    if (this.hasFileInputWidgetTarget) {
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
    if (this.hasFileInputWidgetTarget) {
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
        this.element.classList.remove('hidden');
        validateImage(this.fileInputTarget, file, img);
        if (this.fileInputTarget.checkValidity()) {
          // For images with unknown type, validation will add imageType to the file input dataset.
          if (this.hasTypeInputTarget) {
            const imageType = <string>this.fileInputTarget.dataset.imageType;
            this.element.classList.add(`image-card--${imageType}`);
            this.typeInputTarget.value = imageType;
          }
          this.uploadFile();
        }
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
    // this.dispatch('uploading');
    this.element.classList.add('image-card--uploading');
    this.element.classList.remove('hidden');
    $(this.fileInputTarget).fileupload('send', { files: this.fileInputTarget.files });
  }
  
  onInvalidImage() {
    // $(this.fileInputWidgetTarget).fileinput('reset');
    this.formGroupTarget.classList.add('has-error', 'has-error--validation');
    this.helpBlockTarget.textContent = this.fileInputTarget.validationMessage;
  }

  inputsEnabledValueChanged(shouldEnable: boolean, wasEnabled: boolean) {
    if (shouldEnable === wasEnabled || wasEnabled === undefined) return;

    this.inputTargets.forEach(input => input.disabled = !shouldEnable);
  }

  toggleSelected({ currentTarget: card }: { currentTarget: HTMLElement }) {
    card.classList.toggle('image-card--selected');
    this.dispatch('selected', { detail: { card } })
  }

  openFileDialogValueChanged(shouldOpen: boolean) {
    if (shouldOpen) {
      this.fileInputTarget.click();
      this.openFileDialogValue = false;
    }
  } 
}
