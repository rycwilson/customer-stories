import { Controller } from '@hotwired/stimulus';
import { imageValidatorOptions } from '../user_uploads';

export default class AdsController extends Controller {
  static targets = ['form', 'collectionBtn', 'imageRequirements', 'imageCard', 'newImageCard', 'newLogoCard'];
  declare readonly formTarget: HTMLFormElement;
  declare readonly collectionBtnTargets: HTMLAnchorElement[];
  declare readonly imageRequirementsTargets: HTMLAnchorElement[];
  declare readonly imageCardTargets: HTMLLIElement[];
  declare readonly newImageCardTarget: HTMLLIElement;
  declare readonly newLogoCardTarget: HTMLLIElement;

  declare inputObserver: MutationObserver;
  declare imageTimer: number;

  initialize() {
    $(document)
      .on('change.bs.fileinput', '.ad-image-card', this.onChangeFileInput)
      .on({ 'validated.bs.validator': this.onFileInputValidation }, '#gads-form')
      .on({ 'valid.bs.validator': this.onValidFileInput }, `#${this.formTarget.id}`)
  }

  connect() {
    // console.log('connect ads')
    this.collectionBtnTargets.forEach(this.addCollectionBtnListener.bind(this));
    this.imageRequirementsTargets.forEach(this.initPopover);
    $('#gads-form').validator(imageValidatorOptions);
  }

  uploadFile(card: HTMLLIElement) {
    if (!(card instanceof HTMLLIElement)) return;
    (card.querySelector('input[type="file"]') as HTMLInputElement).click();
  }

  uploadImage() {
    this.uploadFile(this.newImageCardTarget);
  }

  uploadLogo() {
    this.uploadFile(this.newLogoCardTarget);
  }

  onChangeFileInput(e: JQuery.TriggeredEvent) {
    if (e.target.classList.contains('fileinput')) this.handleS3Upload(e.currentTarget);
  }

  handleS3Upload(card: HTMLLIElement) {
    // console.log('handleS3Upload()')
    const img = <HTMLImageElement>card.querySelector('img');
    const formGroup = <HTMLDivElement>card.querySelector('.form-group');
    const urlInput = <HTMLInputElement>card.querySelector(':scope > input[name*="[image_url]"]');
    const isSuccessfulUpload = (
      formGroup: HTMLDivElement, urlInput: HTMLInputElement, mutation: MutationRecord
    ): boolean => (
      mutation.target === urlInput &&
      mutation.type === 'attributes' &&
      mutation.attributeName === 'value' &&
      !formGroup.classList.contains('.has-error')
    )
    this.inputObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (isSuccessfulUpload(formGroup, urlInput, m)) {
          this.inputObserver.disconnect();
          // console.log('isSuccessfulUpload', urlInput.value)

          if (card.classList.contains('gads-default.has-image')) {
            const idInput = <HTMLInputElement>card.querySelector(':scope > input[name*="[id]"]');
            const prevDefaultId = idInput.value;
            this.keepPreviousDefault(prevDefaultId);
            idInput.value = '';
          }

          // pre-load the image so it will be in browser cache when response arrives (no flicker)
          // <HTMLImageElement>formGroup.querySelector('img').addEventListener(
          //   'load', 
          //   () => formGroup.querySelector('.btn-success').dispatchEvent(new Event('click')),
          //   { once: true })
            // .attr('src', $urlInput.val());
          break;
        }
      };
    });
    this.inputObserver.observe(urlInput, { attributes: true });
    if (!this.imageDidLoad(card, img)) {
      this.imageTimer = window.setInterval(this.imageDidLoad, 100, card, img);
    }
  }

  imageDidLoad(card: HTMLLIElement, img: HTMLImageElement) {
    if (img.complete) {
      clearInterval(this.imageTimer);
      // console.log('image did load')

      // the data-validate attribute is to prevent premature validation (per bootstrap-validator)
      if (card.classList.contains('gads-default')) card.classList.add('ad-image-card--new');
      const fileInput = <HTMLInputElement>card.querySelector('input[type="file"]')
      fileInput.setAttribute('data-validate', 'true');
      $('#gads-form').validator('update').validator('validate');
      return true;
    }
  }

  keepPreviousDefault(id: string) {
    const i = this.imageCardTargets.length;
    this.formTarget.insertAdjacentHTML('beforeend', `
      <input type="hidden" name="company[adwords_images_attributes][${i}][id]" value="${id}">
      <input type="hidden" name="company[adwords_images_attributes][${i}][default]" value="false">
      <input class="hidden" type="checkbox" name="company[adwords_images_attributes][${i}][default]" value="true">
    `);
  }

  onFileInputValidation({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    // console.log('validated.bs.validator')
    if (input.type === 'file' && !input.getAttribute('data-default-type')) {
      const card = <HTMLLIElement>input.closest('.ad-image-card--new');
      card.classList.remove('hidden');
    }
  }

  onValidFileInput({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    const isNewImage = input.type === 'file' && input.value;
    if (isNewImage) {
      // console.log('valid.bs.validator')
      // initS3Upload($(e.currentTarget), $input);

      // Change event on the input will trigger the s3 upload
      // => stop the event propagation so that the upload handler does not re-execute
      // $input.closest('.ad-image-card').one('change.bs.fileinput', () => false);
      // $input.trigger('change');
    }
  }

  addCollectionBtnListener(btn: HTMLAnchorElement) {
    $(btn).on('show.bs.tab', (e: JQuery.TriggeredEvent) => {
      this.collectionBtnTargets.forEach(_btn => _btn.classList.toggle('active'));
    });
  }

  validateShortHeadline({ target: input }: { target: HTMLInputElement }) {
    const btn = input.nextElementSibling as HTMLButtonElement;
    if (input.checkValidity()) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
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