import Cookies from 'js-cookie';
import { Controller } from '@hotwired/stimulus';
import type DashboardController from "./dashboard_controller";
import type ResourceController from "./resource_controller";
import type CustomerWinsController from "./customer_wins_controller";
import type ContributionsController from "./contributions_controller";
import type PromotedStoriesController from "./promoted_stories_controller";
import { kebabize } from '../utils';

type TableResourceController = (
  CustomerWinsController | ContributionsController | PromotedStoriesController
);

export default class TableDisplayOptionsController extends Controller {
  static outlets = ['dashboard', 'customer-wins', 'contributions', 'promoted-stories', 'visitors'];
  declare readonly dashboardOutlet: DashboardController;
  declare readonly customerWinsOutlet: ResourceController;
  declare readonly hasCustomerWinsOutlet: boolean;
  declare readonly contributionsOutlet: ResourceController;
  declare readonly hasContributionsOutlet: boolean;
  declare readonly promotedStoriesOutlet: ResourceController;
  declare readonly hasPromotedStoriesOutlet: boolean;
  declare readonly visitorsOutlet: ResourceController;
  declare readonly hasVisitorsOutlet: boolean;

  static targets = ['curatorSelect', 'rowGroupDataSourceInput'];
  declare readonly curatorSelectTarget: TomSelectInput;
  declare readonly rowGroupDataSourceInputTargets: HTMLInputElement[];
  declare readonly hasRowGroupDataSourceInputTarget: boolean;

  clickAwayHandler: (e: Event) => void = this.onClickAway.bind(this);

  get resourceOutlet(): ResourceController {
    if (this.hasCustomerWinsOutlet) return this.customerWinsOutlet;
    if (this.hasContributionsOutlet) return this.contributionsOutlet;
    if (this.hasPromotedStoriesOutlet) return this.promotedStoriesOutlet;
    if (this.hasVisitorsOutlet) return this.visitorsOutlet;
    throw new Error(`No valid resource outlet found for ${this.identifier} controller.`)
  }

  connect() {
    this.setFilters();
    if (this.hasRowGroupDataSourceInputTarget) this.setRowGroupDataSource();
    document.addEventListener('click', this.clickAwayHandler);
  }

  disconnect() {
    document.removeEventListener('click', this.clickAwayHandler);
  }

  onChangeCurator({ target }: { target: TomSelectInput }) {
    this.onChangeFilter({ target });
    setTimeout(() => { this.dashboardOutlet.filtersValue = { curator: +target.value || null}; });
  }

  onChangeRowGroupDataSource({ target }: { target: HTMLInputElement }) {
    (this.resourceOutlet as TableResourceController).rowGroupDataSourceValue = target.value;
  }

  // Filter keys are kebab-cased due to:
  // 1 - For checkboxees, the key is derived from the element id
  // 2 - The key is used in cookies which use kebab-case
  onChangeFilter({ target }: { target: TomSelectInput | HTMLInputElement }) {
    const filterKey = target.type === 'checkbox' ? 
      target.id : 
      kebabize(target.dataset.tomselectKindValue);
    const filterVal = target.type === 'checkbox' ? 
      target.checked : 
      (filterKey === 'curator' ? +target.value || null : target.value);
    const changedFilter = { [filterKey]: filterVal };
    this.resourceOutlet.filtersValue = { ...this.resourceOutlet.filtersValue, ...changedFilter };
    Cookies.set(`csp-${filterKey}-filter`, String(filterVal === null ? '' : filterVal));
  }
  
  onClickAway(e: Event) {
    const target = e.target as HTMLElement;
    if (!this.element || this.element.contains(target) || this.resourceOutlet.displayOptionsBtnTarget.contains(target)) {
      return false;
    }
    // $(this.element).popover('hide')
    this.hide();
  }

  hide() {
    this.resourceOutlet.displayOptionsBtnTarget.click();
  }

  setFilters() {
    Object.entries(this.resourceOutlet.filtersValue).forEach(([filterKey, filterVal]) => {
      if (filterKey.match(/curator|date-range/)) {
        const select = this.element.querySelector(`#${this.resourceOutlet.identifier}-${filterKey}`);
        if (select instanceof HTMLSelectElement) { 
          select.value = filterVal ? String(filterVal) : ''; 
        }
      } else if (typeof filterVal === 'boolean') {
        const checkbox = <HTMLInputElement>this.element.querySelector(`#${filterKey}`);
        if (checkbox) checkbox.checked = filterVal;
      }
    });
  }

  setRowGroupDataSource() {
    const source = (this.resourceOutlet as TableResourceController).rowGroupDataSourceValue;
    this.rowGroupDataSourceInputTargets.forEach(input => {
      input.checked = (input.value === source);
    });
  }
}