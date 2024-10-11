import FormController from './form_controller';
import { debounce } from '../utils';
import tinycolor from 'tinycolor2';
import { setCustomButtonProps } from '../utils';

export default class CtaController extends FormController<CtaController> {
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

  bgColorInputHandler = debounce(this.onInputCustomButtonColor.bind(this, true), 200);
  textColorInputHandler = debounce(this.onInputCustomButtonColor.bind(this), 200);

  connect() {
    this.customButtonBackgroundColorInputTarget.addEventListener('input', this.bgColorInputHandler);
    this.customButtonTextColorInputTarget.addEventListener('input', this.textColorInputHandler);
    setCustomButtonProps(this.customButtonDemoTarget);
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

  onInputCustomButtonColor(shouldCheckContrast = false) {
    if (shouldCheckContrast) this.checkHeadingContrast();
    this.customButtonDemoTarget.dataset.bgColor = this.customButtonBackgroundColorInputTarget.value;
    this.customButtonDemoTarget.dataset.color = this.customButtonTextColorInputTarget.value;
    setCustomButtonProps(this.customButtonDemoTarget);
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
}