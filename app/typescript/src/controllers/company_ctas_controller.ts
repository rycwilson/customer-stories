import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  connect() {
    this.dispatch('did-render');
  }

  onDestroy(e: CustomEvent) {
    const form = <HTMLFormElement>e.target;
    const [xhr, status] = e.detail;
    if (status === 'OK') {
      const id = form.action.match(/\/(?<id>\d+)$/)?.groups?.id;
      const item = <HTMLAnchorElement>this.element.querySelector(`a[href="#edit-cta-${id}"]`);
      item.nextElementSibling?.remove();
      item.remove();
      window.scrollTo(0, 0);
    }
  }
}