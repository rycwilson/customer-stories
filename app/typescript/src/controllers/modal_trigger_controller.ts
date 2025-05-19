import { Controller } from '@hotwired/stimulus';
import type ModalController from './modal_controller.js';

export default class extends Controller<HTMLButtonElement> {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static values = { 
    enabled: { type: Boolean, default: true },
    params: { type: Object, default: { title: '', className: '' } },
  };
  declare readonly enabledValue: boolean;
  declare readonly paramsValue: { title: string, className: string };

  handleClick = this.showModal.bind(this);

  connect() {
    if (this.enabledValue) {
      this.element.addEventListener('click', this.handleClick);
    }
  }

  disconnect() {
    this.element.removeEventListener('click', this.handleClick);
  }

  showModal() {
    this.modalOutlet.titleTarget.textContent = this.paramsValue.title;
    this.modalOutlet.element.classList.add(this.paramsValue.className);
    
    // alllow style changes to render before showing modal
    setTimeout(() => this.modalOutlet.show());
  }
}