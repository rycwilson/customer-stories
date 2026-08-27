import FormController from './form_controller';
import { debounce, setCustomButtonProps } from '../utils';
import tinycolor from 'tinycolor2';

export default class CompanyCtasController extends FormController<CompanyCtasController> {
  static targets = [
    'cta',
    'customButton', 
    'customButtonColorInput',
    'customButtonDemo', 
    'typeSpecificField',
    'companyField'
  ]
  declare readonly ctaTargets: HTMLDivElement[];
  declare readonly customButtonTargets: HTMLDivElement[];
  declare readonly customButtonColorInputTargets: HTMLInputElement[];
  declare readonly customButtonDemoTargets: HTMLButtonElement[];
  declare readonly typeSpecificFieldTargets: HTMLDivElement[];

  colorHandlers = new WeakMap<HTMLInputElement, VoidFunction>();

  connect() {
    super.connect();

    this.customButtonColorInputTargets.forEach(input => {
      const handler = input.name.includes('background') ? 
        debounce(this.onInputCustomButtonColor.bind(this, input, true), 200) :
        debounce(this.onInputCustomButtonColor.bind(this, input), 200)
      this.colorHandlers.set(input, handler);
      input.addEventListener('input', this.colorHandlers.get(input)!);
    });

    this.customButtonDemoTargets.forEach(button => setCustomButtonProps(button));
  }

  disconnect() {
    this.customButtonColorInputTargets.forEach(input => (
      input.removeEventListener('input', this.colorHandlers.get(input)!)
    ));
  }

  toggleType() {
    this.typeSpecificFieldTargets.forEach(field => field.classList.toggle('hidden'));
  }
  
  togglePrimary({ target: _checkbox }: { target: HTMLInputElement }) {
    const cta = this.ctaTargets.find(cta => cta.contains(_checkbox));
    const customButton = this.customButtonTargets.find(div => cta?.contains(div));
    customButton?.classList.toggle('hidden');
    this.customButtonColorInputTargets.forEach(input => input.disabled = !input.disabled);
  }

  onInputCustomButtonColor(input: HTMLInputElement, isBackground = false) {
    const cta = this.ctaTargets.find(cta => cta.contains(input));
    const customButtonDemo = (
      <HTMLButtonElement>this.customButtonDemoTargets.find(button => cta?.contains(button))
    );
    console.log(customButtonDemo)
    
    if (isBackground) {
      const textColorInput = <HTMLInputElement>this.customButtonColorInputTargets.find(colorInput => (
        cta?.contains(colorInput) && colorInput !== input)
      );
      this.checkHeadingContrast(input, textColorInput);
      customButtonDemo.dataset.bgColor = input.value;  
    } else {
      customButtonDemo.dataset.color = input.value;
    }
    setCustomButtonProps(customButtonDemo);
  }

  checkHeadingContrast(bgColorInput: HTMLInputElement, textColorInput: HTMLInputElement) {
    const bgColor = bgColorInput.value;
    const textColor = textColorInput.value;
    const lightTextColor = '#ffffff';
    const darkTextColor = '#333333';
    if (tinycolor(bgColor).isLight() && textColor !== darkTextColor) {
      textColorInput.value = darkTextColor;
    } else if (tinycolor(bgColor).isDark() && textColor !== lightTextColor) {
      textColorInput.value = lightTextColor;
    } else {
      return;
    }
    textColorInput.dispatchEvent(new Event('input'));
  }

  updateCustomButtonText({ target: input }: { target: HTMLInputElement }) {
    const cta = this.ctaTargets.find(cta => cta.contains(input));
    const customButtonDemo = this.customButtonDemoTargets.find(button => cta?.contains(button));
    if (customButtonDemo) customButtonDemo.innerText = input.value;
  }
}