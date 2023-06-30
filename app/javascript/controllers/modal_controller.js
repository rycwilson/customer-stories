import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['title', 'turboFrame', 'railsForm'];

  connect() {
  }

  disconnect() {
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
}