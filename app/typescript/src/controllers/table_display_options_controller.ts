import Cookies from 'js-cookie';
import { Controller } from '@hotwired/stimulus';
import type ResourceController from "./resource_controller";
import { toggleRowGroups as toggleTableRowGroups } from '../tables';

export default class TableDisplayOptionsController extends Controller<HTMLDivElement> {
  static outlets = ['customer-wins', 'contributions', 'promoted-stories', 'visitors'];
  declare readonly customerWinsOutlet: ResourceController;
  declare readonly hasCustomerWinsOutlet: boolean;
  declare readonly contributionsOutlet: ResourceController;
  declare readonly hasContributionsOutlet: boolean;
  declare readonly promotedStoriesOutlet: ResourceController;
  declare readonly hasPromotedStoriesOutlet: boolean;
  declare readonly visitorsOutlet: ResourceController;
  declare readonly hasVisitorsOutlet: boolean;

  static targets = ['curatorSelect'];
  declare readonly curatorSelectTarget: TomSelectInput;

  clickAwayHandler: (e: Event) => void = this.onClickAway.bind(this);

  initialize() {
  }

  connect() {
    document.addEventListener('click', this.clickAwayHandler);

    if (this.hasVisitorsOutlet) {
    } else {
      const groupByCheckbox = <HTMLInputElement>this.element.querySelector('[id*="group-by"]');
      const rowGroupsEnabled = this.resourceOutlet.datatableTarget.classList.contains('has-row-groups');
      if (groupByCheckbox) groupByCheckbox.checked = rowGroupsEnabled;
  
      Object.entries(this.resourceOutlet.filtersValue).forEach(([key, value]) => {
        if (key === 'curator-id') {
          this.curatorSelectTarget.value = value ? String(value) : '';
        } else if (typeof value === 'boolean') {
          const checkbox = <HTMLInputElement>this.element.querySelector(`#${key}`);
          if (checkbox) checkbox.checked = value;
        }
      });
    }
  }

  disconnect() {
    document.removeEventListener('click', this.clickAwayHandler);
  }

  get resourceOutlet(): ResourceController {
    if (this.hasCustomerWinsOutlet) return this.customerWinsOutlet;
    if (this.hasContributionsOutlet) return this.contributionsOutlet;
    if (this.hasPromotedStoriesOutlet) return this.promotedStoriesOutlet;
    if (this.hasVisitorsOutlet) return this.visitorsOutlet;
    throw new Error(`No valid resource outlet found for ${this.identifier} controller.`)
  }

  onChangeCurator({ target: select }: { target: TomSelectInput }) {
    this.resourceOutlet.filtersValue = { ...this.resourceOutlet.filtersValue, 'curator-id': +select.value || null };
    Cookies.set('csp-curator-id', select.value);
  }
  
  onClickAway(e: Event) {
    const target = e.target as HTMLElement;
    if (!this.element || this.element.contains(target) || this.resourceOutlet.displayOptionsBtnTarget.contains(target))
      return false;
    console.log('click away')
    // $(this.element).popover('hide')
    this.resourceOutlet.displayOptionsBtnTarget.click();
  }

  toggleRowGroups({ target: checkbox }: { target: HTMLInputElement }) {
    toggleTableRowGroups.call(this.resourceOutlet, checkbox.checked);
  }

  toggleFilter({ target: checkbox }: { target: HTMLInputElement }) {
    const { id, checked } = checkbox;
    this.resourceOutlet.filtersValue = (
      {...this.resourceOutlet.filtersValue, ...{ [`${id}`]: checked } }
    );
  }
}