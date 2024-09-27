import FormController from './form_controller';
import { imageValidatorOptions } from '../user_uploads';

export default class AdsController extends FormController<AdsController> {
  static targets = [
    'shortHeadlineSubmitBtn',
    'imageRequirements', 
    'imageCard', 
    'newImageCard', 
    'newLogoCard', 
  ];
  declare readonly shortHeadlineSubmitBtnTarget: HTMLButtonElement;
  declare readonly imageRequirementsTargets: HTMLAnchorElement[];
  declare readonly imageCardTargets: HTMLLIElement[];
  declare readonly newImageCardTarget: HTMLLIElement;
  declare readonly newLogoCardTarget: HTMLLIElement;

  validatedShortHeadlineHandler = this.onValidatedShortHeadline.bind(this);

  connect() {
    super.connect();

    // jquery event listeners necessary for hooking into jquery plugin events
    $(this.element)
      .on('validated.bs.validator', this.validatedShortHeadlineHandler)
      .validator(imageValidatorOptions);
    this.imageRequirementsTargets.forEach(this.initPopover);
  }

  disconnect() {
    super.disconnect();
    $(this.element)
      .off('validated.bs.validator', this.validatedShortHeadlineHandler)
      .validator('destroy');
  }

  submitForm({ 
    detail: { card, userAction, imageId } }: { detail: { card: HTMLLIElement, userAction: string, imageId?: number } 
  }) {
    const setFormat = (type: string) => {
      this.element.action = type === 'html' ? 
        this.element.action.replace(/\.json$/, '') :
        (this.element.action.endsWith('.json') ? this.element.action : `${this.element.action}.json`);
    };
    if (userAction == 'add') {
      setFormat('html');
    } else if (userAction === 'makeDefault') {
      setFormat('html');
    } else if (userAction === 'delete') {
      setFormat('json');
      this.element.action += `?image_id=${imageId}`;
    }
    // TODO disable inactive inputs
    this.element.requestSubmit();
  }

  onValidatedShortHeadline({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input.name.includes('short_headline')) {
      const shouldHideSubmitBtn = $(input).data()['bs.validator.errors'].length || input.value === input.dataset.initialValue;
      this.shortHeadlineSubmitBtnTarget.classList.toggle('hidden', shouldHideSubmitBtn);
    }
  }

  onDeletedImage({ detail: [res, status, xhr] }: { detail: [res: { id: string }, status: string, xhr: XMLHttpRequest] }) {
    const card = this.imageCardTargets.find(card => {
      const imageId = card.getAttribute('data-image-card-image-id-value');
      return imageId === res.id;
    });
    card?.remove();
  }

  uploadFile(card: HTMLLIElement) {
    card.setAttribute('data-image-card-open-file-dialog-value', 'true');
  }

  uploadImage() {
    this.uploadFile(this.newImageCardTarget);
  }

  uploadLogo() {
    this.uploadFile(this.newLogoCardTarget);
  }

  validateForm() {
    $(this.element).validator('update').validator('validate');
  }

  keepPreviousDefault(id: string) {
    const i = this.imageCardTargets.length;
    this.element.insertAdjacentHTML('beforeend', `
      <input type="hidden" name="company[adwords_images_attributes][${i}][id]" value="${id}">
      <input type="hidden" name="company[adwords_images_attributes][${i}][default]" value="false">
      <input class="hidden" type="checkbox" name="company[adwords_images_attributes][${i}][default]" value="true">
    `);
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