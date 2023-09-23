import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  onClick(e) {
    e.preventDefault();
    const newDashboardPath = `/${this.element.getAttribute('href').slice(1, this.element.getAttribute('href').length)}`;
    const currentlyOnDashboard = this.element.dataset.dashboardTarget === 'tab';
    if (currentlyOnDashboard) {
      // replacing state ensures turbo:false for the first tab state
      history.replaceState({ turbo: false }, null, location.pathname);
      history.pushState(
        { turbo: { restorationIdentifier: Turbo.navigator.history.restorationIdentifier } }, 
        null, 
        newDashboardPath
      );
    } else {
      // const dropdowns = document.querySelectorAll('#company-nav .nav-settings > li.dropdown');
      // dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
      Turbo.visit(newDashboardPath);
    }
  }
}
