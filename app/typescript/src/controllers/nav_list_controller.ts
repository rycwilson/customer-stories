import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['tab'];
  declare readonly tabTargets: HTMLAnchorElement[];

  showTabHandler = this.onShowTab.bind(this);

  connect() {
    this.tabTargets.forEach(tab => {
      const item = <HTMLLIElement>tab.parentElement;
      tab.classList.toggle('transition', !item.classList.contains('active'));
    });
    this.tabTargets.forEach(tab => $(tab).on('show.bs.tab', this.showTabHandler));
  }

  disconnect() {
    this.tabTargets.forEach(tab => $(tab).off('show.bs.tab', this.showTabHandler));
  }

  onShowTab({ target: tab }: { target: HTMLAnchorElement }) {
    tab.classList.remove('transition');
    setTimeout(() => {
      this.tabTargets.filter(_tab => _tab !== tab).forEach(_tab => _tab.classList.add('transition'));
    });
  }
}