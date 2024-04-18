import { Controller } from "@hotwired/stimulus"
import { visit as turboVisit, navigator as turboNavigator } from "@hotwired/turbo"

type DashboardPath = '/prospect' | '/curate' | '/promote' | '/measure';
export default class extends Controller<HTMLAnchorElement> {
  onClick(e: Event) {
    e.preventDefault();
    const href = this.element.getAttribute('href');
    const newDashboardPath = href ? `/${href.slice(1, href.length)}` : '';
    const currentlyOnDashboard = this.element.dataset.dashboardTarget === 'tab';
    if (currentlyOnDashboard) {
      // replacing state ensures turbo:false for the first tab state
      // history.replaceState({ turbo: false }, '', location.pathname);
      history.pushState(
        { turbo: { restorationIdentifier: turboNavigator.history.restorationIdentifier } }, 
        '', 
        newDashboardPath
      );
      window.dispatchEvent(new CustomEvent('turbo:location-changed', { detail: { newURL: newDashboardPath } }));
    } else if (newDashboardPath) {
      // const dropdowns = document.querySelectorAll('#company-nav .nav-settings > li.dropdown');
      // dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
      turboVisit(newDashboardPath);
    }
  }
}
