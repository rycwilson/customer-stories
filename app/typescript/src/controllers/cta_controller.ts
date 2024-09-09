import FormController from './form_controller';
import { debounce } from '../utils';
import tinycolor from 'tinycolor2';

export default class CtaController extends FormController<CtaController> {
  static values = { customButtonBackgroundColor: String, customButtonTextColor: String }
  declare readonly customButtonBackgroundColorValue: string;
  declare readonly customButtonTextColorValue: string;

  static targets = [
    'customButton', 
    'customButtonBackgroundColorInput', 
    'customButtonTextColorInput', 
    'customButtonDemo', 
    'typeField',
    'typeSpecificField',
    'companyField'
  ]
  declare readonly customButtonTarget: HTMLDivElement;
  declare readonly customButtonBackgroundColorInputTarget: HTMLInputElement;
  declare readonly customButtonTextColorInputTarget: HTMLInputElement;
  declare readonly customButtonDemoTarget: HTMLButtonElement;
  declare readonly typeFieldTargets: HTMLInputElement[];
  declare readonly typeSpecificFieldTargets: HTMLDivElement[];
  declare readonly companyFieldTargets: HTMLInputElement[];

  bgColorInputHandler = debounce(this.onInputCustomButtonBackgroundColor.bind(this), 200);
  textColorInputHandler = debounce(this.setCustomButtonProps.bind(this, 'color'), 200);

  connect() {
    this.customButtonBackgroundColorInputTarget.addEventListener('input', this.bgColorInputHandler);
    this.customButtonTextColorInputTarget.addEventListener('input', this.textColorInputHandler);
    if (this.customButtonBackgroundColorValue) this.setCustomButtonProps('background', true);
    if (this.customButtonTextColorValue) this.setCustomButtonProps('color', true);
  }

  disconnect() {
    this.customButtonBackgroundColorInputTarget.removeEventListener('input', this.bgColorInputHandler);
    this.customButtonTextColorInputTarget.removeEventListener('input', this.textColorInputHandler);
  }

  toggleType() {
    this.typeSpecificFieldTargets.forEach(field => field.classList.toggle('hidden'));
  }

  togglePrimary({ target: checkbox }: { target: HTMLInputElement }) {
    this.customButtonTarget.classList.toggle('hidden');
    this.companyFieldTargets.forEach(field => field.disabled = !field.disabled);
  }

  onInputCustomButtonBackgroundColor() {
    this.checkHeadingContrast();
    this.setCustomButtonProps('background');
  }

  checkHeadingContrast() {
    const bgColor = this.customButtonBackgroundColorInputTarget.value;
    const textColorInput = this.customButtonTextColorInputTarget;
    const lightTextColor = '#ffffff';
    const darkTextColor = '#333333';
    if (tinycolor(bgColor).isLight() && textColorInput.value !== darkTextColor) {
      textColorInput.value = darkTextColor;
    } else if (tinycolor(bgColor).isDark() && textColorInput.value !== lightTextColor) {
      textColorInput.value = lightTextColor;
    } else {
      return;
    }
    textColorInput.dispatchEvent(new Event('input'));
  }

  updateCustomButtonText({ target: input }: { target: HTMLInputElement }) {
    this.customButtonDemoTarget.innerText = input.value;
  }

  // Using css variables to capture style allows for use of the custom-button-variant mixin,
  // which itself is just a copy of bootstrap's button-variant mixin that has been modified to use css variables.
  // Thus standard bootstrap styling is conserved while allowing for dynamic custom button colors.
  setCustomButtonProps(prop: 'background' | 'color', isControllerConnect = false) {
    const btn = this.customButtonDemoTarget;
    if (prop === 'background') {
      const bgColor = isControllerConnect ? 
        this.customButtonBackgroundColorValue : 
        this.customButtonBackgroundColorInputTarget.value;
      btn.style.setProperty('--btn-custom-bg', bgColor);
      btn.style.setProperty('--btn-custom-bg-darken-10', tinycolor(bgColor).darken(10).toString());
      btn.style.setProperty('--btn-custom-bg-darken-17', tinycolor(bgColor).darken(17).toString());
      btn.style.setProperty('--btn-custom-border', bgColor);
      btn.style.setProperty('--btn-custom-border-darken-17', tinycolor(bgColor).darken(17).toString());
      btn.style.setProperty('--btn-custom-border-darken-25', tinycolor(bgColor).darken(25).toString());
    } else {
      const color = isControllerConnect ? this.customButtonTextColorValue : this.customButtonTextColorInputTarget.value;
      btn.style.setProperty('--btn-custom-color', color);
    }
  }
}