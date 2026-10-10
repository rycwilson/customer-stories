import { Controller } from '@hotwired/stimulus';
import type ModalController from './modal_controller.js';

export default class extends Controller<HTMLButtonElement> {
  static outlets = ['modal'];
  static values = { 
    enabled: { type: Boolean, default: true },
    options: { type: Object, default: { title: '', className: '' } },
  };

  private declare readonly modalOutlet: ModalController;
  private declare readonly enabledValue: boolean;
  private declare readonly optionsValue: { title: string, className?: string };
  private onTrigger = this.showModal.bind(this);

  connect() {
    if (this.enabledValue) {
      this.element.addEventListener('click', this.onTrigger);
    }
  }

  disconnect() {
    this.element.removeEventListener('click', this.onTrigger);
  }

  
  beforeFetchModalContent(e: MouseEvent) {
    if (!this.enabledValue) {
      e.preventDefault();
    }
  }
  
  private showModal(_e: Event) {
    const { title, className } = this.optionsValue;
    this.modalOutlet.titleTarget.textContent = title;
    if (className) this.modalOutlet.element.classList.add(className);
    setTimeout(this.modalOutlet.show.bind(this.modalOutlet));
  }
}