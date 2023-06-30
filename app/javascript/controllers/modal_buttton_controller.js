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
    this.modalOutlet.titleTarget.textContent = this.titleValue;
    if (this.modalOutlet.hasTurboFrameTarget) {
      const frame = this.modalOutlet.turboFrameTarget;
      frame.id = this.turboFrameAttrsValue.id;
      frame.src = this.turboFrameAttrsValue.src;
    }
    this.modalOutlet.show();
  }
}