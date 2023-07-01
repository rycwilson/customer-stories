import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['title', 'turboFrame', 'railsForm', 'footer'];
  static values = { 
    turboFrameAttrs: { type: Object, default: {} },
    newActionClassName: String, 
    showActionClassName: String, 
    editActionClassName: String 
  };

  connect() {
  }

  disconnect() {
  }

  turboFrameAttrsValueChanged(attrs) {
    if (Object.keys(attrs).includes('id') && Object.keys(attrs).includes('src')) {
      this.turboFrameTarget.id = attrs.id;
      this.turboFrameTarget.src = attrs.src;
      [this.newActionClassNameValue, this.showActionClassNameValue, this.editActionClassNameValue]
        .forEach(className => {
          const action = className.match(/--(?<action>\w+)/).groups.action;
          this.footerTarget.classList.toggle(className, this.isAction(action));
        });
    }
  }

  show() {
    $(this.element).modal('show');
  }

  hide() {
    $(this.element).modal('hide');
  }

  onSuccess(e, data, status, xhr) {
    if (data.status === 'ok') {
      this.hide();
    } else {
      // handle errors
    }
  }
  
  onFrameRender(e) {
    if (this.hasRailsFormTarget) {
      $(this.railsFormTarget).on('ajax:success', this.onSuccess.bind(this))
    }
  }

  isAction(action) {
    if (!this.turboFrameAttrsValue.src) return false;
    if (action === 'new') return this.turboFrameAttrsValue.src.match(/\/\w+$/)
    else if (action === 'show') return this.turboFrameAttrsValue.src.match(/\/\d+$/)
    else if (action === 'edit') return this.turboFrameAttrsValue.src.match(/\/edit$/)
    else return false;
  }
}