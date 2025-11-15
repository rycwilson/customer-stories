import type DashboardController from "./dashboard_controller";
import { Controller } from "@hotwired/stimulus";
import { getJSON } from '../utils';
import { initDisplayOptions, search as searchTable } from '../tables';

export default class ResourceController extends Controller<HTMLElement> {
  static outlets = ['dashboard'];
  declare readonly dashboardOutlet: DashboardController;

  static targets = [
    'searchSelect', 
    'info',
    'paginate',
    'displayOptionsBtn',
    'datatable'
  ];
  declare readonly searchSelectTarget: TomSelectInput;
  declare readonly infoTarget: HTMLElement;
  declare readonly paginateTarget: HTMLElement;
  declare readonly datatableTarget: HTMLDivElement;
  declare readonly hasDatatableTarget: boolean;
  declare readonly displayOptionsBtnTarget: HTMLButtonElement;
  declare readonly hasDisplayOptionsBtnTarget: boolean;
  
  static values = {
    dataPath: String,
    init: { type: Boolean, default: false },
    filters: { type: Object },
    displayOptionsHtml: String,
    newRecord: { type: Object, default: undefined }
  }
  declare readonly dataPathValue: string;
  declare readonly initValue: boolean;
  declare filtersValue: ResourceFilters;
  declare readonly displayOptionsHtmlValue: string;
  declare newRecordValue: CustomerWin | Contribution | undefined;

  connect() {
    if (this.hasDisplayOptionsBtnTarget) initDisplayOptions.call(this);
  }

  get resourceName() {
    return this.element.dataset.resourceName as ResourceName;
  }

  get dataExists() {
    return false;
    // return this.resourceName === 'storyContributions' ?
    //   CSP[this.resourceName][+(this.element.dataset.storyId as string)] :
    //   CSP[this.resourceName];
  }

  get tableInitialized() {
    return this.hasDatatableTarget && $.fn.dataTable.isDataTable(this.datatableTarget);
  }

  initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;

    if (this.dataExists) {
      this.initTable();
    } else {
      this.dispatch('loading');
      getJSON(this.dataPathValue).then(data => {
        if (this.resourceName === 'storyContributions') {
          CSP[this.resourceName][+(this.element.dataset.storyId as string)] = data;
        } else {
          CSP[this.resourceName] = data;
        } 
        this.initTable();
      })
    }
  }

  initTable() {
    if (this.hasDatatableTarget) {
      this.datatableTarget.setAttribute('data-datatable-init-value', 'true');
    }
  }

  onTableInitialized(e: CustomEvent) {
    if (this.identifier === 'customer-wins') {
      (window as any).dt = e.detail.dt; 
    }
    setTimeout(() => {
      e.detail.dt.one('draw', () => {
        this.dispatch('ready', { detail: { resourceName: this.resourceName } });
      })
      searchTable.call(this);
    });
  }

  onTomselectSearch(e: CustomEvent) {
    if (this.hasDatatableTarget) {
      searchTable.call(this, e.detail.searchResults);
    }
  }

  onChangeSearchSelect(e: CustomEvent) {
    // this.addSyncListener((ctrl) => ctrl.searchSelectTarget.tomselect.setValue(this.searchSelectTarget.value));
    if (this.hasDatatableTarget) {
      searchTable.call(this);
    }
  }

  rowGroupDataSourceValueChanged(source: string) {
    this.datatableTarget.setAttribute('data-datatable-row-group-data-source-value', source);
  }
  
  filtersValueChanged(newVal: ResourceFilters, oldVal: ResourceFilters) {
    // console.log(`old ${this.identifier} filtersValue:`, oldVal)
    // console.log(`new ${this.identifier} filtersValue:`, newVal)
    if (this.tableInitialized) {
      searchTable.call(this);
    }
  }

  newRecordValueChanged(record: CustomerWin | Contribution) {
    CSP[this.resourceName].push(record);
    const columnName = (() => {
      switch (this.resourceName) {
        case 'customerWins': return 'success';
        case 'contributions': return 'contribution';
        default: return undefined;
      }
    })();
    if (!columnName) throw new Error('Unrecognized resource name for new record handling.');
    
    // Reload will not cause a redraw, but changing searchSelect will
    this.element.addEventListener(
      'datatable:drawn', 
      () => {
        setTimeout(() => {
          const toggleChildBtn = <HTMLButtonElement>this.element.querySelector(
          `tr[data-customer-win-row-data-value*='"id":${record.id}'] td.toggle-child button`
          );
          toggleChildBtn.click();
        });
      },
      { once: true }
    );
    this.datatableTarget.setAttribute('data-datatable-reload-value', this.resourceName);
    setTimeout(() => this.searchSelectTarget.tomselect.setValue(`${columnName}-${record.id}`));
    
    // TODO: The above approach is working reasonable well, but it may be better to search the
    // table directly instead of changing searchSelect.
    // 1. Change this.filterValue as necessary to ensure the search results include the record
    // 2. Set the curator field in the form to readonly, else we may need to change curator 
    // preference to another user and that will be weird given that curator applies across 
    // the dashboard
    // 3. For contributions, changing searchSelect won't even work because contributions
    // are not among the options (perhaps they should be, even if hidden)

    // TODO: Show the new record via table search
    // this.datatableTarget.setAttribute(
    //   'data-datatable-search-params-value',
    //   JSON.stringify(...)
    // )

    // TODO: After searching, redraw
    // this.datatableTarget.setAttribute('data-datatable-redraw-value', 'true');
  }

  // addSyncListener(syncResource: (ctrl: ResourceController) => void) {
  //   this.element.addEventListener('datatable:drawn', () => {
  //     this.resourceOutlets.forEach(ctrl => {
  //       // console.log('syncing:', ctrl.resourceName);
  //       if (ctrl['dt']) setTimeout(() => syncResource(ctrl));   // dt exists if the table has loaded
  //     });
  //   }, { once: true });
  // }
}