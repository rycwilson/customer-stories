import { Controller } from '@hotwired/stimulus';

export default class ModalController extends Controller<HTMLDivElement> {
  static targets = ['title', 'body', 'footer'];
  declare readonly titleTarget: HTMLHeadingElement;
  declare readonly bodyTarget: HTMLDivElement;
  declare readonly hasBodyTarget: boolean;
  declare readonly footerTarget: HTMLDivElement;

  static values = { 
    title: { type: String, default: 'title is missing' },
    bodyContent: { type: String, default: '' },
  };

  declare initialClassName: string;

  onHidden = this.handleHidden.bind(this)

  connect() {
    this.initialClassName = this.element.className;
    $(this.element).modal({ show: false })
    $(this.element).on('hidden.bs.modal', this.onHidden);
  }

  disconnect() {
    $(this.element).off('hidden.bs.modal', this.onHidden);
  }
    
  show() {
    $(this.element).modal('show');
  }

  hide() {
    $(this.element).modal('hide');
  }

  handleHidden() {
    this.element.className = this.initialClassName;
    this.titleTarget.textContent = '';
    [...this.bodyTarget.children]
      .filter(element => !element.classList.contains('spinner'))
      ?.forEach(element => element.remove());
    this.footerTarget?.remove();
  }
}
