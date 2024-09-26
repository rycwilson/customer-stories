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
    const ctrl = this;
    $(this.switchTarget).bootstrapSwitch({
      size: this.sizeValue,
      inverse: true,
      disabled: this.disabledValue,
      animate: this.animateValue,
      onInit: function (e: Event) {},
      onSwitchChange: function (e: Event, state: boolean) {
        ctrl.dispatch('switch', { detail: { state } });
      }
    })
  }

  disconnect() {
    $(this.switchTarget).bootstrapSwitch('destroy');
  }

  get state() {
    return $(this.element).bootstrapSwitch('state');
  }
}