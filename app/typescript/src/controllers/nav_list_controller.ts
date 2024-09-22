// This controller was meant to allow for dynamic handling of tab transitions.
// Challenge: How to impolement transition behavior on the inactive tabs but not on the active tab?
// Easy enough with css to stop transition on active tab, but how to stop transition on the tab that was previously active? 
// There's probably some css solution, but I couldn't quite come up with it. Hence this controller.
// But... The approach here leads to weird transitions on page load, e.g. dark background color flicker on the tabs
// Solutions mentioned on the web don't seem to help. Abandoning this approach for now.

import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['tab'];
  declare readonly tabTargets: HTMLAnchorElement[];

  showTabHandler = this.onShowTab.bind(this);

  connect() {
    // this.tabTargets.forEach(tab => {
    //   const item = <HTMLLIElement>tab.parentElement;
    //   tab.classList.toggle('transition', !item.classList.contains('active'));
    // });
    // this.tabTargets.forEach(tab => $(tab).on('show.bs.tab', this.showTabHandler));
  }

  disconnect() {
    // this.tabTargets.forEach(tab => $(tab).off('show.bs.tab', this.showTabHandler));
  }

  onShowTab({ target: tab }: { target: HTMLAnchorElement }) {
    tab.classList.remove('transition');
    setTimeout(() => {
      this.tabTargets.filter(_tab => _tab !== tab).forEach(_tab => _tab.classList.add('transition'));
    });
  }
}