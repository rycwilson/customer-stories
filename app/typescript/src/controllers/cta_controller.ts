import FormController from './form_controller';

export default class CtaController extends FormController<CtaController> {
  static targets = ['primaryCta', 'primaryCtaBackgroundColor', 'primaryCtaTextColor']
  declare readonly primaryCtaTarget: HTMLDivElement;
  declare readonly primaryCtaBackgroundColorTarget: HTMLInputElement;
  declare readonly primaryCtaTextColorTarget: HTMLInputElement;

  connect() {
    // console.log('connect ctas')
  }

  togglePrimary({ target: checkbox }: { target: HTMLInputElement }) {
    const makingPrimary = checkbox.value === 'true';
    this.primaryCtaTarget.classList.toggle('hidden');
  }
}