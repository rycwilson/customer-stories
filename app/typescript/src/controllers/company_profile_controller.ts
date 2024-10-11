import FormController from './form_controller';
import { imageValidatorOptions } from '../user_uploads';
import tinycolor from 'tinycolor2';

export default class CompanyProfileController extends FormController<CompanyProfileController> {
  static targets = [
    'squareLogoCard',
    'landscapeLogoCard',
    'companyHeaderDemo', 
    'storiesHeaderDemo', 
    'storiesHeadingDemo', 
    'storiesHeadingColorInput'
  ];
  declare readonly squareLogoCardTarget: HTMLLIElement;
  declare readonly landscapeLogoCardTarget: HTMLLIElement;
  declare readonly companyHeaderDemoTarget: HTMLDivElement;
  declare readonly storiesHeaderDemoTarget: HTMLDivElement;
  declare readonly storiesHeadingDemoTarget: HTMLHeadingElement;
  declare readonly storiesHeadingColorInputTarget: HTMLInputElement;

  connect() {
    super.connect();
    $(this.element).validator(imageValidatorOptions);
  }

  disconnect() {
    $(this.element).validator('destroy');
  }

  onAjaxSuccess({ detail: [data, status, xhr] }: { detail: [data: any, status: string, xhr: XMLHttpRequest] }) {
    console.log('company profile', status)
  }

  onUploadReady({ detail: { card } }: { detail: { card: HTMLLIElement } }) {
    console.log('card', card)
    card.classList.remove('image-card--uploading');
  }

  onInputCompanyHeaderBackgroundColor({ target: input }: { target: HTMLInputElement }) {
    this.companyHeaderDemoTarget.style.backgroundColor = input.value;
  }

  onInputStoriesHeaderBackgroundColor({ target: input }: { target: HTMLInputElement }) {
    const backgroundShade = tinycolor(input.value).isDark() ? 'dark' : 'light';
    const classModifier = `--bg-${backgroundShade}`;
    const backgroundShadeChanged = !this.storiesHeaderDemoTarget.className.includes(classModifier);
    this.storiesHeaderDemoTarget.style.backgroundColor = input.value;
    if (backgroundShadeChanged) {
      const newStoriesHeadingColor = backgroundShade === 'light' ? '#333333' : '#ffffff';
      this.storiesHeaderDemoTarget.className = this.storiesHeaderDemoTarget.className
        .replace(/--bg-(light|dark)/, `--bg-${backgroundShade}`);
      this.storiesHeadingDemoTarget.style.color = this.storiesHeadingColorInputTarget.value = newStoriesHeadingColor;
    }
  }

  onInputStoriesHeadingColor({ target: input }: { target: HTMLInputElement }) {
    this.storiesHeadingDemoTarget.style.color = input.value;
  } 
}