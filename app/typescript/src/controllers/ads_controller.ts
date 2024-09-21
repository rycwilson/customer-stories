import FormController from './form_controller';
import { imageValidatorOptions } from '../user_uploads';
import { capitalize } from '../utils';

export default class AdsController extends FormController<AdsController> {
  static targets = [
    'collectionBtn', 
    'imageRequirements', 
    'imageCard', 
    'newImageCard', 
    'newLogoCard', 
  ];
  declare readonly collectionBtnTargets: HTMLAnchorElement[];
  declare readonly imageRequirementsTargets: HTMLAnchorElement[];
  declare readonly imageCardTargets: HTMLLIElement[];
  declare readonly newImageCardTarget: HTMLLIElement;
  declare readonly newLogoCardTarget: HTMLLIElement;

  declare inputObserver: MutationObserver;
  declare imageTimer: number;

  showCollectionHandler = this.onShowCollection.bind(this);
  changeFileInputHandler = this.onChangeFileInput.bind(this);
  validatedFileInputHandler = this.onValidatedFileInput.bind(this);
  validFileInputHandler = this.onValidFileInput.bind(this);
  invalidFileInputHandler = this.onInvalidFileInput.bind(this);
  
  connect() {
    super.connect();
    // jquery event listeners necessary for hooking into jquery plugin events
    $(this.element)
      .on('show.bs.tab', this.showCollectionHandler)
      .on('change.bs.fileinput', '.ad-image-card', this.changeFileInputHandler)
      .on('validated.bs.validator', this.validatedFileInputHandler)
      .on('valid.bs.validator', this.validFileInputHandler)
      .on('invalid.bs.validator', this.invalidFileInputHandler)
      .validator(imageValidatorOptions);

    this.imageRequirementsTargets.forEach(this.initPopover);
  }

  disconnect() {
    super.disconnect();
    $(this.element)
      .off('show.bs.tab', this.showCollectionHandler)
      .off('change.bs.fileinput', '.ad-image-card', this.changeFileInputHandler)
      .off('validated.bs.validator', this.validatedFileInputHandler)
      .off('valid.bs.validator', this.validFileInputHandler)
      .off('invalid.bs.validator', this.invalidFileInputHandler)
      .validator('destroy');
  }

  submitForm(e: CustomEvent) {
    const { card, imageId, action } = e.detail;
    if (action === 'makeDefault') {
      this.element.action = this.element.action.replace(/\.json$/, '');
    } else if (action === 'delete') {
      if (!this.element.action.endsWith('.json')) this.element.action += '.json';
      this.element.action += `?image_id=${imageId}`;
    }
    card.classList.add('ad-image-card--saving');
    this.element.requestSubmit();
  }

  onDeletedImage({ detail: [res, status, xhr] }: { detail: [res: { id: string }, status: string, xhr: XMLHttpRequest] }) {
    const card = this.imageCardTargets.find(card => {
      const imageId = card.getAttribute('data-image-card-image-id-value');
      return imageId === res.id;
    });
    card?.remove();
  }

  uploadFile(card: HTMLLIElement) {
    (<HTMLInputElement>card.querySelector('input[type="file"]')).click();
  }

  uploadImage() {
    this.uploadFile(this.newImageCardTarget);
  }

  uploadLogo() {
    this.uploadFile(this.newLogoCardTarget);
  }

  onChangeFileInput({ target: formGroup, currentTarget: card }: { target: HTMLDivElement, currentTarget: HTMLLIElement }) {
    if (formGroup.classList.contains('fileinput')) this.handleS3Upload(formGroup, card);
  }

  handleS3Upload(formGroup: HTMLDivElement, card: HTMLLIElement) {
    const img = <HTMLImageElement>card.querySelector('img');
    const urlInput = <HTMLInputElement>card.querySelector(':scope > input[name*="[image_url]"]');
    const isSuccessfulUpload = (mutation: MutationRecord): boolean => {
      const { target, type, attributeName } = mutation;
      return formGroup.classList.contains('has-error') ?
        false :
        target === urlInput && type === 'attributes' && attributeName === 'value';
    };
    this.inputObserver = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (isSuccessfulUpload(m)) {
          this.inputObserver.disconnect();
          console.log('isSuccessfulUpload', urlInput.value)

          if (card.classList.contains('gads-default.has-image')) {
            const idInput = <HTMLInputElement>card.querySelector(':scope > input[name*="[id]"]');
            const prevDefaultId = idInput.value;
            this.keepPreviousDefault(prevDefaultId);
            idInput.value = '';
          }

          // pre-load the image so it will be in browser cache when response arrives (no flicker)
          img.addEventListener(
            'load', 
            () => (<HTMLButtonElement>formGroup.querySelector('.btn-success')).dispatchEvent(new Event('click')),
            { once: true }
          )
          img.setAttribute('src', urlInput.value);
          break;
        }
      };
    });
    this.inputObserver.observe(urlInput, { attributes: true });
    if (!this.imageDidLoad(card, img)) {
      this.imageTimer = window.setInterval(this.imageDidLoad.bind(this, card, img), 100);
    }
  }

  imageDidLoad(card: HTMLLIElement, img: HTMLImageElement) {
    if (img.complete) {
      window.clearInterval(this.imageTimer);
      console.log('image did load')

      // the data-validate attribute is to prevent premature validation (per bootstrap-validator)
      if (card.classList.contains('gads-default')) card.classList.add('ad-image-card--new');
      const fileInput = <HTMLInputElement>card.querySelector('input[type="file"]')
      fileInput.setAttribute('data-validate', 'true');
      $(this.element).validator('update').validator('validate');
      return true;
    }
  }

  keepPreviousDefault(id: string) {
    const i = this.imageCardTargets.length;
    this.element.insertAdjacentHTML('beforeend', `
      <input type="hidden" name="company[adwords_images_attributes][${i}][id]" value="${id}">
      <input type="hidden" name="company[adwords_images_attributes][${i}][default]" value="false">
      <input class="hidden" type="checkbox" name="company[adwords_images_attributes][${i}][default]" value="true">
    `);
  }

  onValidatedFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input.type === 'file' && !input.getAttribute('data-default-type')) {
      console.log('validated.bs.validator', input)
      const card = <HTMLLIElement>input.closest('.ad-image-card--new');
      card.classList.remove('hidden');
    }
  }

  onValidFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    const isNewImage = input.type === 'file' && input.value;
    if (isNewImage) {
      console.log('valid.bs.validator', input)
      // initS3Upload($(e.currentTarget), $input);
      // initS3FileInput(input);
      $(input).fileupload('send', { files: input.files });

      // Change event on the input will trigger the s3 upload
      // => stop the event propagation so that the upload handler does not re-execute
      // $input.closest('.ad-image-card').one('change.bs.fileinput', () => false);
      // $input.trigger('change');
    }
  }

  onInvalidFileInput() {
    this.inputObserver.disconnect();
  }

  onShowCollection(e: JQuery.TriggeredEvent) {
    this.collectionBtnTargets.forEach(btn => btn.classList.toggle('active'));
  }

  setNewDefault(
    { detail: { card, kind, toggleDefault } }: { detail: { card: HTMLLIElement, kind: AdImageKind, toggleDefault: boolean } }
  ) {
    const sameKind = (_card: HTMLLIElement) => (new RegExp(`--${kind}`)).test(_card.className);
    this.imageCardTargets
      .filter(_card => sameKind(_card) && _card !== card)
      .forEach(_card => {
        _card.setAttribute(
          'data-image-card-toggle-default-value', 
          _card.classList.contains('gads-default') ? `${toggleDefault}` : 'false');
      });
  }

  validateShortHeadline({ target: input }: { target: HTMLInputElement }) {
    const btn = input.nextElementSibling as HTMLButtonElement;
    btn.classList.toggle('hidden', !input.checkValidity());
  }

  initPopover(link: HTMLAnchorElement) {
    $(link).popover({
      html: true,
      container: 'body',
      placement: 'auto',
      template: `
        <div class="popover image-requirements" role="tooltip">
          <div class="arrow"></div>
          <h3 class="popover-title label-secondary"></h3>
          <div class="popover-content"></div>
        </div>
      `,
      content: function () {
        return `
          <h4><strong>Square ${$(this).is('.marketing') ? 'Image' : 'Logo'}</strong></h4>
          <span>(${$(this).is('.marketing') ? 'required' : 'optional/recommended'})</span>
          <ul>
            <li>Minimum dimensions: ${$(this).data('square-min')}</li>
            <li>Aspect ratio within 1% of ${$(this).data('square-ratio')}</li>
            ${$(this).is('.logos') ? 
              `<li>Suggested dimensions: ${$(this).data('square-suggest')}</li>` : 
              ''
            }
            <li>Maximum size: 5MB (5,242,880 bytes)</li>
            <li>Image may be cropped horizontally up to 5% on each side</li>
            <li>Text may cover no more than 20% of the image</li>
            ${$(this).is('.logos') ?
              '<li>Transparent background is best, but only if the logo is centered</li>' : 
              ''
            }
          </ul>
          <h4><strong>Landscape ${$(this).is('.marketing') ? 'Image' : 'Logo'}</strong></h4>
          <span>(${$(this).is('.marketing') ? 'required' : 'optional/recommended'})</span>
          <ul>
            <li>Minimum dimensions: ${$(this).data('landscape-min')}</li>
            <li>Aspect ratio within 1% of ${$(this).data('landscape-ratio')}</li>
            ${$(this).is('.logos') ? 
              `<li>Suggested dimensions: ${$(this).data('landscape-suggest')}</li>` :
              ''
            }
            <li>Maximum size: 5MB (5,242,880 bytes)</li>
            <li>Image may be cropped horizontally up to 5% on each side</li>
            <li>Text may cover no more than 20% of the image</li>
            ${$(this).is('.logos') ? 
              '<li>Transparent background is best, but only if the logo is centered</li>' :
              ''
            }
          </ul>
        `;
      }
    });
  }
}