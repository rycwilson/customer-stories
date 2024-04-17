import FormController from './form_controller';
import { initS3Upload } from '../user_uploads';
import { hexToRgb, colorContrast } from '../utils';
import '@claviska/jquery-minicolors';

export default class CompanyProfileController extends FormController<CompanyProfileController> {
  static targets = [
    'companyHeaderDemo', 
    'storiesHeaderDemo', 
    'storiesHeadingDemo', 
    'companyHeaderColor', 
    'storiesHeaderColor', 
    'storiesHeadingColor'
  ];
  declare readonly companyHeaderDemoTarget: HTMLDivElement;
  declare readonly storiesHeaderDemoTarget: HTMLDivElement;
  declare readonly storiesHeadingDemoTarget: HTMLHeadingElement;
  declare readonly companyHeaderColorTarget: HTMLInputElement;
  declare readonly storiesHeaderColorTarget: HTMLInputElement;
  declare readonly storiesHeadingColorTarget: HTMLInputElement;

  connect() {
    // console.log('connect company profile')
    initS3Upload($(this.element));
    this.initColorPickers();
  }

  onAjaxComplete({ detail: [xhr, status] }: { detail: [xhr: XMLHttpRequest, status: string] }) {
    const { company } = JSON.parse(xhr.response);
    if (status === 'OK') {
      // console.log('company:', company);
      if (company.previous_changes.logo_url) {
        const s3Data = JSON.parse(this.element.dataset.s3 as string);
        const { s3_direct_post: { fields: postData } } = JSON.parse(xhr.response);
        this.element.dataset.s3 = JSON.stringify({ ...s3Data, postData });
        initS3Upload($(this.element));
      }
    } else {
      // let FormController handle errors
    }
  }

  initColorPickers() {
    const storiesHeaderDemoClassName = 'company-logo-upload__stories-header';

    // company header color
    this.companyHeaderColorTarget.addEventListener('input', () => {
      const hexColor = this.companyHeaderColorTarget.value;
      this.companyHeaderDemoTarget.style.backgroundColor = hexColor;
    });

    // stories header color
    this.storiesHeaderColorTarget.addEventListener('input', () => {
      const hexColor = this.storiesHeaderColorTarget.value;
      const rgbColor = hexToRgb(hexColor) as { r: number, b: number, g: number };
      const bgClassModifier = colorContrast(rgbColor);
      const contrastSwitched = !this.storiesHeaderDemoTarget.className.match(new RegExp(`--${bgClassModifier}`));   
      this.storiesHeaderDemoTarget.style.backgroundColor = hexColor;
      if (contrastSwitched) {
        const newStoriesHeadingColor = bgClassModifier === 'bg-light' ? '#333333' : '#ffffff';
        this.storiesHeaderDemoTarget.classList.remove(
          `${storiesHeaderDemoClassName}--bg-light`, 
          `${storiesHeaderDemoClassName}--bg-dark`
        );
        this.storiesHeaderDemoTarget.classList.add(`${storiesHeaderDemoClassName}--${bgClassModifier}`);
        this.storiesHeadingDemoTarget.style.color = newStoriesHeadingColor;
        this.storiesHeadingColorTarget.value = newStoriesHeadingColor;
      }
    });

    // stories heading color
    this.storiesHeadingColorTarget.addEventListener('input', () => {
      const hexColor = this.storiesHeadingColorTarget.value;
      this.storiesHeadingDemoTarget.style.color = hexColor;
    });
  }
}