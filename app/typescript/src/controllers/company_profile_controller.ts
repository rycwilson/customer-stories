import FormController from './form_controller';
import { initS3FileInput } from '../user_uploads';
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
    // console.log('connect company profile')
  }

  onAjaxComplete({ detail: [xhr, status] }: { detail: [xhr: XMLHttpRequest, status: string] }) {
    const { company } = JSON.parse(xhr.response);
    if (status === 'OK') {
      if (company.previous_changes.logo_url) {
        const s3Data = JSON.parse(this.element.dataset.s3 as string);
        const { s3_direct_post: { fields: postData } } = JSON.parse(xhr.response);
        this.element.dataset.s3 = JSON.stringify({ ...s3Data, postData });
        // initS3Upload($(this.element));
      }
    } else {
      // let FormController handle errors
    }
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