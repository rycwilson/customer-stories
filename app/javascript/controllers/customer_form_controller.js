import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['logoContainer'];

  toggleShowName(e) {
    this.logoContainerTarget.classList.toggle('with-customer-name');
  }
}