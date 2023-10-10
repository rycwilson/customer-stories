import { Controller } from "@hotwired/stimulus"
import * as Turbo from "@hotwired/turbo"

type DashboardPath = '/prospect' | '/curate' | '/promote' | '/measure';
export default class extends Controller<HTMLAnchorElement> {
  onClick(e: Event) {
    e.preventDefault();
    const href = this.element.getAttribute('href');
    const newDashboardPath = href ? `/${href.slice(1, href.length)}` : '';
    const currentlyOnDashboard = this.element.dataset.dashboardTarget === 'tab';
    if (currentlyOnDashboard) {
      // replacing state ensures turbo:false for the first tab state
      history.replaceState({ turbo: false }, '', location.pathname);
      history.pushState(
        { turbo: { restorationIdentifier: Turbo.navigator.history.restorationIdentifier } }, 
        '', 
        newDashboardPath
      );
    } else if (newDashboardPath) {
      // const dropdowns = document.querySelectorAll('#company-nav .nav-settings > li.dropdown');
      // dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
      Turbo.visit(newDashboardPath);
    }
  }
}
