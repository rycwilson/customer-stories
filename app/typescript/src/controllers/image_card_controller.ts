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
    toggleDefault: { type: Boolean, default: false }   // whether the defaultImageCheckbox should be checked
  }
  declare readonly kindValue: string;
  declare readonly imageIdValue: number;
  declare openFileDialogValue: boolean;
  declare toggleDefaultValue: boolean;

  static targets = [
    'formGroup', 
    'imgWrapper', 
    'imageUrlInput', 
    'fileInput', 
    'adImageCheckbox', 
    'defaultImageCheckbox', 
    '_destroyImageCheckbox'
  ];
  declare readonly formGroupTarget: HTMLDivElement;
  declare readonly imgWrapperTarget: HTMLDivElement;
  declare readonly imageUrlInputTarget: HTMLInputElement;
  declare readonly fileInputTarget: HTMLInputElement;
  declare readonly adImageCheckboxTarget: HTMLInputElement;
  declare readonly defaultImageCheckboxTarget: HTMLInputElement;
  declare readonly _destroyImageCheckboxTarget: HTMLInputElement;

  declare imageLoadTimer: number;

  changeFileInputHandler = this.onChangeFileInput.bind(this);
  validatedFileInputHandler = this.onValidatedFileInput.bind(this);
  validFileInputHandler = this.onValidFileInput.bind(this);
  invalidFileInputHandler = this.onInvalidFileInput.bind(this);

  connect() {
    // jquery event listeners necessary for hooking into jquery plugin events
    $(this.formGroupTarget).on('change.bs.fileinput', this.changeFileInputHandler);

    // bootstrap validator events trigger on the form 
    if (this.hasAdsOutlet) {
      $(this.adsOutlet.element)
        .on('validated.bs.validator', this.validatedFileInputHandler)
        .on('valid.bs.validator', this.validFileInputHandler)
        .on('invalid.bs.validator', this.invalidFileInputHandler);
    }

    if (this.fileInputTarget.hasAttribute('data-s3')) {
      initS3FileInput(this.fileInputTarget, onS3Done.bind(this));
    }
  }
  
  disconnect() {
    $(this.formGroupTarget).off('change.bs.fileinput', this.changeFileInputHandler);
    
    // after disconnect, any outlets (e.g. the parent form) will be null
    $(this.element.closest('form'))
      .off('validated.bs.validator', this.validatedFileInputHandler)
      .off('valid.bs.validator', this.validFileInputHandler)
      .off('invalid.bs.validator', this.invalidFileInputHandler);
  }

  onChangeFileInput({ target }: { target: HTMLElement }) {
    if (target === this.formGroupTarget) {
      // this.observeS3Upload();

      // jasny-bootstrap will remove and replace the image, this time with src set to the loaded image data
      if (!this.imageDidLoad()) {
        this.imageLoadTimer = window.setInterval(this.imageDidLoad.bind(this), 100);
      }
    } else {
      console.log('is there another?', target)
    }
  }

  imageDidLoad() {
    if (this.imgTarget?.complete) {
      window.clearInterval(this.imageLoadTimer);
      console.log('image did load')
      if (this.isDefaultImage) {
        this.element.classList.add('ad-image-card--new');
      }
      this.fileInputTarget.setAttribute('data-validate', 'true');
      this.dispatch('image-ready');
      return true;
    }
  }

  onValidatedFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget && !this.isDefaultImage) {
      console.log('validated.bs.validator')
      this.element.classList.remove('hidden');
    }
  }

  onValidFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget && input.value) {
      console.log('valid.bs.validator', input)
      $(input).fileupload('send', { files: input.files });

      // Change event on the input will trigger the s3 upload
      // => stop the event propagation so that the upload handler does not re-execute
      // $input.closest('.ad-image-card').one('change.bs.fileinput', () => false);
      // $input.trigger('change');
    }
  }

  onInvalidFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input === this.fileInputTarget && input.value) {
      console.log('invalid.bs.validator', input)
    }
  }

  makeDefault() {
    this.toggleDefaultValue = true;
    this.dispatchMakeDefaultEvent();
  }
  
  toggleDefaultValueChanged(newVal: boolean, oldVal: boolean) {
    // console.log(`toggleDefaultValueChanged(${newVal}, ${oldVal})`);˝˝
    if (oldVal === undefined) return;
    this.defaultImageCheckboxTarget.checked = newVal;
    if (!this.isDefaultImage) this.formGroupTarget.classList.toggle('to-be-default', newVal);
  }

  deleteImage() {
    this._destroyImageCheckboxTarget.checked = true;
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

  toggleSelected({ currentTarget: card }: { currentTarget: HTMLLIElement }) {
    card.classList.toggle('selected');
    this.adImageCheckboxTarget.checked = !this.adImageCheckboxTarget.checked;
  }

  openFileDialogValueChanged(newVal: boolean, oldVal: boolean | undefined) {
    // console.log(`openFileDialogValueChanged(${newVal}, ${oldVal})`)
    if (newVal) {
      this.fileInputTarget.click();
      this.openFileDialogValue = false;
    }
  } 

  get isDefaultImage() {
    return this.element.classList.contains('gads-default');
  }

  // jasny-bootstrap will remove and replace the img tag when uploading
  get imgTarget() {
    return <HTMLImageElement>this.imgWrapperTarget.querySelector(':scope > img');
  }
}
