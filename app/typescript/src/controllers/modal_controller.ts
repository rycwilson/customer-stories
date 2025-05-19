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

  declare spinnerTimer: number;
  declare initialClassName: string;

  handleHidden: (this: ModalController, e: any) => void = this.onHidden.bind(this);

  // private observer = new MutationObserver((mutations: MutationRecord[]) => {
  //   if (this.hasBodyTarget) {
  //     this.show();
  //   }
  // })

  connect() {
    this.initialClassName = this.element.className;
    $(this.element).on('hidden.bs.modal', this.handleHidden);
  }

  disconnect() {
    $(this.element).off('hidden.bs.modal', this.handleHidden);
  }
  
  // onAjaxSuccess({ detail: [data, status, xhr] }: { detail: [data: any, status: string, xhr: XMLHttpRequest] }) {
  //   this.hide();
  // }
  
  show() {
    $(this.element).modal('show');
  }

  hide() {
    $(this.element).modal('hide');
  }

  onHidden() {
    this.element.className = this.initialClassName;
    this.titleTarget.textContent = '';
    [...this.bodyTarget.children]
      .filter(element => !element.classList.contains('spinner'))
      ?.forEach(element => element.remove());
    this.footerTarget?.remove();
  }
}
