import FormController from './form_controller';

export default class AdsController extends FormController<AdsController> {
  static targets = [
    'shortHeadlineSubmitBtn',
    'imageRequirements', 
    'imageCard',
    'defaultImageCard',
    'newImageCard', 
    'newLogoCard',
    'defaultInput',
    'destroyInput',
    'requirementsHelpBlock',
    'activeCollectionInput'
  ];
  declare readonly shortHeadlineInputTarget: HTMLInputElement;
  declare readonly shortHeadlineSubmitBtnTarget: HTMLButtonElement;
  declare readonly imageRequirementsTargets: HTMLAnchorElement[];
  declare readonly imageCardTargets: HTMLLIElement[];
  declare readonly defaultImageCardTargets: HTMLLIElement[];
  declare readonly hasDefaultImageCardTargets: boolean;
  declare readonly newImageCardTarget: HTMLLIElement;
  declare readonly newLogoCardTarget: HTMLLIElement;
  declare readonly defaultInputTargets: HTMLInputElement[];
  declare readonly destroyInputTargets: HTMLInputElement[];
  declare readonly requirementsHelpBlockTargets: HTMLSpanElement[];
  declare readonly activeCollectionInputTarget: HTMLInputElement;

  validatedShortHeadlineHandler = this.onValidatedShortHeadline.bind(this);
  shownTabHandler = this.onShownTab.bind(this);

  connect() {
    super.connect();

    // jquery event listeners necessary for hooking into jquery plugin events
    $(this.element)
      .on('shown.bs.tab', this.shownTabHandler)
      .on('validated.bs.validator', this.validatedShortHeadlineHandler)
    this.imageRequirementsTargets.forEach(this.initPopover);
  }

  disconnect() {
    $(this.element)
      .off('shown.bs.tab', this.shownTabHandler)
      .off('validated.bs.validator', this.validatedShortHeadlineHandler)
    super.disconnect();
  }

  submitForm(_e: CustomEvent<{ card: HTMLElement }>) {
    this.element.requestSubmit()
  }

  onValidatedShortHeadline({ relatedTarget: input }: { relatedTarget: HTMLInputElement }) {
    if (input.name.includes('short_headline')) {
      const hasNotChanged = input.value === input.dataset.initialValue;
      const hasErrors = $(input).data()['bs.validator.errors'].length > 0;
      this.shortHeadlineSubmitBtnTarget.classList.toggle('hidden', hasNotChanged || hasErrors);
    }
  }

  onShownTab() {
    this.requirementsHelpBlockTargets.forEach(span => span.classList.toggle('hidden'));
  }
  
  uploadImage() {
    this.uploadFile(this.newImageCardTarget);
  }
  
  uploadLogo() {
    this.uploadFile(this.newLogoCardTarget);
  }

  uploadFile(card: HTMLLIElement) {
    card.setAttribute('data-image-card-open-file-dialog-value', 'true');
  }

  setNewDefaultImage({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const { card: newDefaultCard, defaultInput: newDefaultInput } = this.imageCardElements(button);
    const imageType = newDefaultCard.className.match(
      /image-card--(?<type>SquareImage|LandscapeImage|SquareLogo|LandscapeLogo)/
    )!.groups!.type;
    newDefaultInput.value = 'true';
    newDefaultCard.setAttribute('data-image-card-inputs-enabled-value', 'true');
    newDefaultCard.classList.add('to-be-default');
    
    const oldDefaultCard = this.defaultImageCardTargets?.find(card => (
      card.className.includes(`image-card--${imageType}`)
    ));
    if (oldDefaultCard) {
      const oldDefaultInput = 
        <HTMLInputElement>this.defaultInputTargets.find(input => oldDefaultCard.contains(input));
      oldDefaultCard.setAttribute('data-image-card-inputs-enabled-value', 'true')
      oldDefaultInput.value = 'false';
    }
  }

  deleteImage({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const { card, destroyInput } = this.imageCardElements(button);
    destroyInput.value = 'true';
    card.setAttribute('data-image-card-inputs-enabled-value', 'true');
    card.classList.add('to-be-removed');
  }

  resetImageCard({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const { card, defaultInput, destroyInput } = this.imageCardElements(button);
    if (card?.classList.contains('to-be-default')) {
      defaultInput.value = 'false';
    } else if (card?.classList.contains('to-be-removed')) {
      destroyInput.value = 'false';
    }
    card.setAttribute('data-image-card-inputs-enabled-value', 'false');
    card.classList.remove('to-be-default', 'to-be-removed');
  }

  imageCardElements(childButton: HTMLButtonElement) {
    const card = <HTMLElement>this.imageCardTargets.find(card => card.contains(childButton));
    const defaultInput = this.defaultInputTargets.find(input => card.contains(input));
    const destroyInput = this.destroyInputTargets.find(input => card.contains(input));
    return { 
      card,
      defaultInput: defaultInput as HTMLInputElement || undefined,
      destroyInput: destroyInput as HTMLInputElement || undefined 
    };
  }

  updateActiveCollection({ target: btn }: { target: HTMLAnchorElement }) {
    const collection = btn.dataset.collection;
    if (collection === 'images' || collection === 'logos') {
      this.activeCollectionInputTarget.value = collection;
    }
  }

  initPopover(link: HTMLAnchorElement) {
    const collection = link.dataset.collection;
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
          <h4><strong>Square ${collection === 'images' ? 'Image' : 'Logo'}</strong></h4>
          <span>(${collection === 'images' ? 'required' : 'optional/recommended'})</span>
          <ul>
            <li>Minimum dimensions: ${$(this).data('square-min')}</li>
            <li>Aspect ratio within 1% of ${$(this).data('square-ratio')}</li>
            ${collection === 'logos' ? `<li>Suggested dimensions: ${$(this).data('square-suggest')}</li>` : ''}
            <li>Maximum size: 5MB (5,242,880 bytes)</li>
            <li>Image may be cropped horizontally up to 5% on each side</li>
            <li>Text may cover no more than 20% of the image</li>
            ${collection === 'logos' ?
              '<li>Transparent background is best, but only if the logo is centered</li>' : 
              ''
            }
          </ul>
          <h4><strong>Landscape ${collection === 'images' ? 'Image' : 'Logo'}</strong></h4>
          <span>(${collection === 'images' ? 'required' : 'optional/recommended'})</span>
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
            ${collection === 'logos' ? '<li>Transparent background is best, but only if the logo is centered</li>' : ''}
          </ul>
        `;
      }
    });
  }
}