import { Controller } from "@hotwired/stimulus";
import DashboardController from "./dashboard_controller";
import { getJSON, kebabize } from '../utils';
import { 
  init as initTable,
  initComplete as tableInitComplete,
  search as searchTable
} from '../tables.js';
import { tableConfig as customerWinsTableConfig, newCustomerWinPath } from '../customer_wins/customer_wins';
import { tableConfig as contributorsTableConfig, newContributionPath } from '../contributions/contributions';
import DataTable from 'datatables.net-bs';
import type { Api, Config } from "datatables.net-bs";
import 'datatables.net-rowgroup-bs';

export default class ResourceController extends Controller<HTMLDivElement> {
  static outlets = ['dashboard', 'resource'];
  declare readonly dashboardOutlet: DashboardController;
  declare readonly resourceOutlet: ResourceController;

  static targets = ['curatorSelect', 'filterSelect', 'filterResults', 'datatable', 'newItemBtn', 'tableDisplayOptionsBtn'];
  declare readonly curatorSelectTarget: HTMLSelectElement;
  declare readonly filterSelectTarget: HTMLSelectElement;
  declare readonly filterResultsTarget: HTMLDivElement;
  declare readonly datatableTarget: HTMLDivElement;
  declare readonly newItemBtnTarget: HTMLButtonElement;
  declare readonly tableDisplayOptionsBtnTarget: HTMLButtonElement;
  
  static values = { dataPath: String, checkboxFilters: { type: Object, default: {} } }
  declare readonly dataPathValue: string;
  declare checkboxFiltersValue: { [inputId: string]: { checked: boolean, label: string }};

  // dt is defined when the table is initialized
  // declare dt instead of initializing it to avoid having to allow for undefined value
  // if the table fails to initialize, errors will be handled in the datatable controller
  declare dt: Api<any>;
  
  connect() {
    // console.log(`connect ${this.resourceName}`)
    if (CSP[this.resourceName]) {
      initTable(this);
    } else {
      getJSON(this.dataPathValue).then(data => {
        CSP[this.resourceName] = data;
        initTable(this);
      })
    }
  }

  get resourceName() {
    return this.element.dataset.resourceName as 'customerWins' | 'contributions';
  }

  tableInitComplete(e: CustomEvent) {
    tableInitComplete(this, e.detail.dt);
  }

  searchTable(e: CustomEvent) {
    searchTable(this, e, this.resourceOutlet);
  }

  onCuratorChange(e: CustomEvent) {
    this.updateNewItemPath();
    searchTable(this, e, this.resourceOutlet);
  }

  onFilterChange(e: CustomEvent) {
    this.updateNewItemPath();
    this.resourceOutlet.updateNewItemPath();
    searchTable(this, e, this.resourceOutlet);
  }
  
  checkboxFiltersValueChanged(newVal: object, oldVal: object) {
    if (Object.keys(oldVal).length === 0) return false;
    searchTable(this);
  }

  tableConfig(): Config {
    switch (this.resourceName) {
      case 'customerWins':
        return customerWinsTableConfig();
      case 'contributions':
        return contributorsTableConfig();
      // default: 
      //   throw new Error('Missing table configuration');
    } 
  }

  updateNewItemPath() {
    const filterVal = this.filterSelectTarget.value;
    const type = filterVal && filterVal.slice(0, filterVal.lastIndexOf('-'));
    const id = filterVal && filterVal.slice(filterVal.lastIndexOf('-') + 1, filterVal.length);
    const customerWinId = type === 'success' ? id : '';
    const params = new URLSearchParams();
    params.set('curator_id', this.curatorSelectTarget.value);
    if (filterVal) params.set(`${type}_id`, id);
    this.newItemBtnTarget.setAttribute(
      'data-modal-trigger-turbo-frame-attrs-value',
      JSON.stringify({ 
        id: `new-${kebabize(this.resourceName)}`.slice(0, -1),  // remove the trailing 's' 
        src: (() => {
          switch (this.resourceName) {
            case 'customerWins':
              return newCustomerWinPath(params);
            case 'contributions':
              return newContributionPath(customerWinId, params);
            default: 
              return '';
          }
        })()
      })
    );
  }
}