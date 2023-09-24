import { Controller } from "@hotwired/stimulus";
import { getJSON, kebabize } from '../util';
import { 
  init as initTable,
  initComplete as tableInitComplete,
  search as searchTable
} from '../tables';
import { tableConfig as customerWinsTableConfig, newCustomerWinPath } from '../customer_wins/customer_wins';
import { tableConfig as contributorsTableConfig, newContributionPath } from '../contributions/contributions';

export default class extends Controller<HTMLDivElement> {
  static outlets = ['dashboard', 'resource'];
  static targets = ['curatorSelect', 'filterSelect', 'filterResults', 'datatable', 'newItemBtn', 'tableDisplayOptionsBtn'];
  static values = { dataPath: String, checkboxFilters: { type: Object, default: {} } }

  dt;
  resourceName;

  initialize() {
    // console.log(`init ${this.element.dataset.resourceName}`);
    this.resourceName = this.element.dataset.resourceName;
  }
  
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

  tableInitComplete(e) {
    tableInitComplete(this, e.detail.dt);
  }

  searchTable(e = { type: '', detail: {} }) {
    searchTable(this, e, this.resourceOutlet);
  }

  onCuratorChange(e) {
    this.updateNewItemPath();
    searchTable(this, e, this.resourceOutlet);
  }

  onFilterChange(e) {
    this.updateNewItemPath();
    this.resourceOutlets.forEach(outlet => outlet.updateNewItemPath());
    searchTable(this, e, this.resourceOutlet);
  }
  
  checkboxFiltersValueChanged(newVal, oldVal) {
    if (Object.keys(oldVal).length === 0) return false;
    searchTable(this);
  }

  tableConfig() {
    switch (this.resourceName) {
      case 'customerWins':
        return customerWinsTableConfig();
      case 'contributions':
        return contributorsTableConfig();
      default: 
        throw new Error('Missing table configuration');
    } 
  }

  updateNewItemPath() {
    const filterVal = this.filterSelectTarget.value;
    const type = filterVal && filterVal.slice(0, filterVal.lastIndexOf('-'));
    const id = filterVal && filterVal.slice(filterVal.lastIndexOf('-') + 1, filterVal.length);
    const customerWinId = type === 'success' && id;
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