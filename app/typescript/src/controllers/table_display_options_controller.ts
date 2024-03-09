import { Controller } from '@hotwired/stimulus';
import type DashboardController from './dashboard_controller';
import type ResourceController from './resource_controller';
import { toggleRowGroups, initDisplayOptions as resetDisplayOptions } from '../tables';

export default class extends Controller<HTMLDivElement> {
  static outlets = ['dashboard', 'resource'];
  declare readonly dashboardOutlet: DashboardController;
  declare readonly resourceOutlet: ResourceController;

  clickAwayHandler: (e: Event) => void = this.onClickAway.bind(this);

  initialize() {
  }

  connect() {
    document.addEventListener('click', this.clickAwayHandler);
  }

  disconnect() {
    resetDisplayOptions(this.resourceOutlet, true);
    document.removeEventListener('click', this.clickAwayHandler);
  }
  
  onClickAway(e: Event) {
    const target = e.target as HTMLElement;
    if (!this.element || this.element.contains(target) || this.resourceOutlet.tableDisplayOptionsBtnTarget.contains(target))
      return false;
    
    // $(this.element).popover('hide')
    this.resourceOutlet.tableDisplayOptionsBtnTarget.click();
  }

  toggleRowGroups({ target: checkbox }: { target: HTMLInputElement }) {
    if (!(checkbox instanceof HTMLInputElement)) return;
    toggleRowGroups(this.resourceOutlet, checkbox.checked);
  }

  toggleFilter({ target: checkbox }: { target: HTMLInputElement }) {
    const { id, checked } = checkbox;
    const label = this.resourceOutlet.checkboxFiltersValue.id.label;
    this.resourceOutlet.checkboxFiltersValue = (
      {...this.resourceOutlet.checkboxFiltersValue, ...{ [`${id}`]: { checked, label } } }
    );
  }
}