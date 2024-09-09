import { Controller } from '@hotwired/stimulus';
import type ModalController from './modal_controller.js';

export default class extends Controller<HTMLButtonElement> {
  static outlets = ['modal'];
  declare readonly modalOutlet: ModalController;

  static values = { 
    title: { type: String, default: 'Title is missing' },
    turboFrameAttrs: { type: Object, default: {} },
    enabled: { type: Boolean, default: true }
  };
  declare readonly titleValue: string;
  declare readonly turboFrameAttrsValue: { id: string, src: string };
  declare readonly enabledValue: boolean;

  connect() {
    if (this.enabledValue) {
      this.element.addEventListener('click', this.showModal.bind(this));
    }
  }

  showModal() {
    const { id: turboFrameId, src: turboFrameSrc } = this.turboFrameAttrsValue;
    this.modalOutlet.titleTarget.textContent = this.titleValue;
    if (turboFrameId && turboFrameSrc && this.modalOutlet.hasTurboFrameTarget) {
      this.modalOutlet.turboFrameAttrsValue = { ...this.turboFrameAttrsValue };
    }
    // alllow style changes to render before showing modal
    setTimeout(() => this.modalOutlet.show());
  }
}