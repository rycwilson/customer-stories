import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static values = {
    enabled: { type: Boolean, default: false },
    config: { type: Object, default: {} }
  }

  connect() {
    console.log('connect summernote')
    if (this.enabledValue) this.init();
  }

  init() {
    console.log('init summernote')
    $(this.element).prop('contenteditable', 'true').summernote(this.configValue);
  }

  destroy() {
    $(this.element).summernote('destroy');
  }

  enabledValueChanged(shouldEnable) {
    console.log('enabledValueChanged', shouldEnable)
    shouldEnable ? this.init() : this.destroy();
  }
}