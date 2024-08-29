import { Controller } from '@hotwired/stimulus';

interface TooltipOptions {
  title: string,
  placement?: string,
  container?: string,
}

const baseOptions: TooltipOptions = { title: 'I am a tooltip', container: 'body' };

export default class TooltipController extends Controller {
  static values = {
    options: { type: Object, default: {} }
  }
  declare optionsValue: TooltipOptions;

  connect() {
    $(this.element).tooltip({ ...baseOptions, ...this.optionsValue });
  }

  disconnect() {
    $(this.element).tooltip('destroy');
  }

  optionsValueChanged(newOptions: TooltipOptions) {
    console.log(newOptions)
    $(this.element).tooltip('destroy');
    $(this.element).tooltip({ ...baseOptions, ...newOptions });
  }
}