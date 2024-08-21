import { Controller } from '@hotwired/stimulus';

export default class BootstrapSwitchController extends Controller {
  static values = {
    size: { type: String, default: 'normal' },
    animate: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  }
  declare sizeValue: string;
  declare animateValue: boolean;
  declare disabledValue: boolean;

  static targets = ['switch'];
  declare switchTarget: HTMLInputElement;

  connect() {
    $(this.switchTarget).bootstrapSwitch({
      size: this.sizeValue,
      inverse: true,
      disabled: this.disabledValue,
      animate: this.animateValue,
      onInit: function (e: Event) {},
    });
  }

  disconnect() {
    $(this.switchTarget).bootstrapSwitch('destroy');
  }
}