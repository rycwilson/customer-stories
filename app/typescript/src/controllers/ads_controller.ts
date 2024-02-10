import { Controller } from '@hotwired/stimulus';

export default class AdsController extends Controller {
  static targets = ['form', 'collectionBtn', 'imageRequirements', 'imageCard', 'newImageCard', 'newLogoCard'];
  declare readonly formTarget: HTMLFormElement;
  declare readonly collectionBtnTargets: HTMLAnchorElement[];
  declare readonly imageRequirementsTargets: HTMLAnchorElement[];
  declare readonly imageCardTargets: HTMLLIElement[];
  declare readonly newImageCardTarget: HTMLLIElement;
  declare readonly newLogoCardTarget: HTMLLIElement;

  connect() {
    // console.log('connect ads')
    // console.log('this.imageRequirementsTargets', this.imageRequirementsTargets)
    
    // this.collectionTabTargets.forEach(toggleActiveCollectionTab);
    this.collectionBtnTargets.forEach(this.addCollectionBtnListener.bind(this))
    this.imageRequirementsTargets.forEach(this.initPopover);
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

  addCollectionBtnListener(btn: HTMLAnchorElement) {
    $(btn).on('show.bs.tab', (e) => {
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

  initPopover(a: HTMLAnchorElement) {
    $(a).popover({
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