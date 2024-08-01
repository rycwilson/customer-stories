import { Controller } from '@hotwired/stimulus';

export default class InputSpinnerController extends Controller<HTMLDivElement> {
  static targets = ['input', 'incrementBtn', 'decrementBtn'];
  declare inputTarget: HTMLInputElement;
  declare incrementBtnTarget: HTMLButtonElement;
  declare decrementBtnTarget: HTMLButtonElement;

  static values = { 
    enabled: { type: Boolean, default: true },
    initial: { type: Number, default: 0 },
    step: { type: Number, default: 1 },
  };
  declare enabledValue: boolean;
  declare initialValue: number;
  declare stepValue: number;

  connect() {
    // console.log('connect input spinner')
  }

  increment() {
    this.render(+this.inputTarget.value + this.stepValue);
  }

  decrement() {
    this.render(+this.inputTarget.value - this.stepValue);
  }

  render(newVal: number) {
    this.inputTarget.value = newVal.toString();
    this.incrementBtnTarget.disabled = newVal === +this.inputTarget.max;
    this.decrementBtnTarget.disabled = newVal === +this.inputTarget.min;
    this.inputTarget.dispatchEvent(new Event('change', { bubbles: true }));
  }

  enabledValueChanged(enabled: boolean) {
    this.inputTarget.value = this.enabledValue ? this.initialValue.toString() : '';
    this.inputTarget.readOnly = this.incrementBtnTarget.disabled = this.decrementBtnTarget.disabled = !enabled;
  }

  onKeypress(e: Event) {
    e.preventDefault();
  }
}