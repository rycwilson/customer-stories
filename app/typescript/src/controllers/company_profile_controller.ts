import FormController from './form_controller';
import { imageValidatorOptions } from '../user_uploads';
import tinycolor from 'tinycolor2';

export default class CompanyProfileController extends FormController<CompanyProfileController> {
  static targets = [
    'companyHeaderDemo', 
    'storiesHeaderDemo', 
    'storiesHeadingDemo', 
    'storiesHeadingColorInput'
  ];
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
    super.disconnect();
  }

  // rails-ujs is disabled on the form
  // onAjaxSuccess({ detail: [data, status, xhr] }: { detail: [data: any, status: string, xhr: XMLHttpRequest] }) {
  // }

  onUploadReady({ detail: { card } }: { detail: { card: HTMLLIElement } }) {
    [...this.companyHeaderDemoTarget.children].forEach((link: Element) => {
      if (card.className.includes(link.className)) {
        const url = (<HTMLInputElement>card.querySelector(':scope > input[name*="url"]')).value;
        (<HTMLImageElement>link.querySelector(':scope > img')).src = url;
      }
    });
  }

  onChangeHeaderLogoType({ target: input }: { target: HTMLInputElement }) {
    [...this.companyHeaderDemoTarget.children].forEach((link: Element) => {
      link.classList.toggle('hidden', !link.classList.contains(input.value));
    });
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