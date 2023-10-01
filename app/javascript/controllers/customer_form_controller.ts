import { Controller } from '@hotwired/stimulus';

export default class extends Controller<HTMLFormElement> {
  static targets = ['logoContainer'];

  declare readonly logoContainerTarget: HTMLDivElement;

  toggleShowName(e: Event) {
    this.logoContainerTarget.classList.toggle('with-customer-name');
  }
}