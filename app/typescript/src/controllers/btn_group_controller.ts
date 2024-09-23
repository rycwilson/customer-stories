import { Controller } from '@hotwired/stimulus';

export default class BtnGroupController extends Controller<HTMLDivElement> {
  static values = { enableTabs: { type: Boolean, default: true } };
  declare readonly enableTabsValue: boolean;

  static targets = ['btn'];
  declare readonly btnTargets: HTMLButtonElement[] | HTMLAnchorElement[];

  showTabHandler = this.onShowTab.bind(this);

  connect() {
    if (this.enableTabsValue) $(this.element).on('show.bs.tab', this.showTabHandler);
  }

  disconnect() {
    if (this.enableTabsValue) $(this.element).off('show.bs.tab', this.showTabHandler);
  }

  onShowTab({ target: btn }: { target: HTMLAnchorElement }) {
    this.btnTargets.forEach(_btn => _btn.classList.toggle('active', _btn === btn));
  }
}