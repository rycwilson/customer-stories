import FormController from './form_controller';
import { debounce } from '../utils';
import tinycolor from 'tinycolor2';

export default class CtaController extends FormController<CtaController> {
  static values = { primaryCtaBackgroundColor: String, primaryCtaTextColor: String }
  declare readonly primaryCtaBackgroundColorValue: string;
  declare readonly primaryCtaTextColorValue: string;

  static targets = [
    'primaryCta', 
    'primaryCtaBackgroundColorInput', 
    'primaryCtaTextColorInput', 
    'primaryCtaButton', 
    'typeSpecificField'
  ]
  declare readonly primaryCtaTarget: HTMLDivElement;
  declare readonly primaryCtaBackgroundColorInputTarget: HTMLInputElement;
  declare readonly primaryCtaTextColorInputTarget: HTMLInputElement;
  declare readonly primaryCtaButtonTarget: HTMLButtonElement;
  declare readonly typeSpecificFieldTargets: HTMLDivElement[];

  bgColorInputHandler = debounce(this.setCustomButtonProps.bind(this, 'background'), 200);
  textColorInputHandler = debounce(this.setCustomButtonProps.bind(this, 'color'), 200);

  connect() {
    // console.log('connect ctas')

    this.primaryCtaBackgroundColorInputTarget.addEventListener('input', this.bgColorInputHandler);
    this.primaryCtaTextColorInputTarget.addEventListener('input', this.textColorInputHandler);
    if (this.primaryCtaBackgroundColorValue) this.setCustomButtonProps('background', true);
    if (this.primaryCtaTextColorValue) this.setCustomButtonProps('color', true);
  }

  disconnect() {
    this.primaryCtaBackgroundColorInputTarget.removeEventListener('input', this.bgColorInputHandler);
    this.primaryCtaTextColorInputTarget.removeEventListener('input', this.textColorInputHandler);
  }

  toggleType() {
    this.typeSpecificFieldTargets.forEach(field => field.classList.toggle('hidden'));
  }

  togglePrimary({ target: checkbox }: { target: HTMLInputElement }) {
    // const makingPrimary = checkbox.value === 'true';
    this.primaryCtaTarget.classList.toggle('hidden');
  }

  onInputPrimaryCtaBackgroundColor({ target: input }: { target: HTMLInputElement }) {
    const bgColor = input.value
    const textColorInput = this.primaryCtaTextColorInputTarget;
    const lightTextColor = '#ffffff';
    const darkTextColor = '#333333';
    if (tinycolor(bgColor).isLight() && textColorInput.value !== darkTextColor) {
      textColorInput.value = darkTextColor;
    } else if (tinycolor(bgColor).isDark() && textColorInput.value !== lightTextColor) {
      textColorInput.value = lightTextColor;
    } else {
      return;
    }
    input.addEventListener(
      'focusout', 
      () => textColorInput.dispatchEvent(new Event('input')),
      { once: true }
    );
  }

  updateButtonText({ target: input }: { target: HTMLInputElement }) {
    this.primaryCtaButtonTarget.innerText = input.value;
  }

  setCustomButtonProps(prop: 'background' | 'color', isControllerConnect = false) {
    const btn = this.primaryCtaButtonTarget;
    if (prop === 'background') {
      const bgColor = isControllerConnect ? 
        this.primaryCtaBackgroundColorValue : 
        this.primaryCtaBackgroundColorInputTarget.value;
      btn.style.setProperty('--btn-custom-bg', bgColor);
      btn.style.setProperty('--btn-custom-bg-darken-10', tinycolor(bgColor).darken(10).toString());
      btn.style.setProperty('--btn-custom-bg-darken-17', tinycolor(bgColor).darken(17).toString());
      btn.style.setProperty('--btn-custom-border', bgColor);
      btn.style.setProperty('--btn-custom-border-darken-17', tinycolor(bgColor).darken(17).toString());
      btn.style.setProperty('--btn-custom-border-darken-25', tinycolor(bgColor).darken(25).toString());
    } else {
      console.log(this.primaryCtaTextColorValue)
      const color = isControllerConnect ? this.primaryCtaTextColorValue : this.primaryCtaTextColorInputTarget.value;
      btn.style.setProperty('--btn-custom-color', color);
    }
  }
}