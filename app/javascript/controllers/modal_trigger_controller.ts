import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static outlets = ['modal'];
  static values = { 
    title: { type: String, default: 'Title is missing' },
    turboFrameAttrs: { type: Object, default: {} }
  };

  connect() {
  }

  showModal() {
    const { id: turboFrameId, src: turboFrameSrc } = this.turboFrameAttrsValue;
    this.modalOutlet.titleTarget.textContent = this.titleValue;
    if (turboFrameId && turboFrameSrc && this.modalOutlet.hasTurboFrameTarget) {
      this.modalOutlet.turboFrameAttrsValue = { ...this.turboFrameAttrsValue };
    }
    this.modalOutlet.show();
  }
}