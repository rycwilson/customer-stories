import type DashboardController from "./dashboard_controller";
import { Controller } from "@hotwired/stimulus";
import { getJSON } from '../utils';
import { 
  init as initTable,
  onInitialized as onTableInitialized,
  search as searchTable,
  addRow as addTableRow,
  showRow as showTableRow,
  initDisplayOptions } from '../tables';

type ResourceFilters = (
  CustomerWinsFilters |
  ContributionsFilters |
  PromotedStoriesFilters |
  VisitorsFilters
);

type SearchObject = { column: string, q: string, regEx: boolean, smartSearch: boolean }

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

  get sharedSearchObjects(): SearchObject[] {
    const curatorId = this.filtersValue.curator;
    return [{ 
      column: 'curator',
      q: curatorId ? `^${curatorId}$` : '',
      regEx: true,
      smartSearch: false
    }];
  }

  initTable = initTable.bind(this);
  onTableInitialized = onTableInitialized.bind(this);
  searchTable = searchTable.bind(this);
  addTableRow = addTableRow.bind(this);
  showTableRow = showTableRow.bind(this);

  connect() {
    if (this.hasDisplayOptionsBtnTarget) initDisplayOptions.call(this);
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
      this.searchTable(e.detail.searchSelectResults);
    }
  }

  onChangeSearchSelect(e: CustomEvent) {
    // this.addSyncListener((ctrl) => ctrl.searchSelectTarget.tomselect.setValue(this.searchSelectTarget.value));
    if (this.hasDatatableTarget) {
      this.searchTable();
    }
  }

  rowGroupDataSourceValueChanged(source: string) {
    // Both will be ignored by the datatables controller if the table is not yet initialized
    this.datatableTarget.setAttribute('data-datatable-row-group-data-source-value', source);
    this.datatableTarget.setAttribute('data-datatable-redraw-value', 'true');
  }
  
  filtersValueChanged(newFilters: ResourceFilters, oldFilters: ResourceFilters) {
    // if (this.identifier === 'customer-wins') {
      // console.log(`old ${this.identifier} filtersValue:`, oldFilters)
      // console.log(`new ${this.identifier} filtersValue:`, newFilters)
    // }
    if (this.tableInitialized) {
      this.searchTable();
    }
  }

  newResourceValueChanged(record: CustomerWin | Contribution) {
    this.addTableRow(record, true);

    // Searches for the row and expands its child row
    // this.showTableRow(record.id);
  }
  
  validateNewItem(e: Event) {
    const btn = <HTMLButtonElement>e.currentTarget;
    if (this.filtersValue.curator && this.filtersValue.curator !== CSP.currentUser!.id) {
      const label = btn?.ariaLabel?.match(/^New (?<label>.+)$/)?.groups?.label;
      const mesg = `Can't add a new ${label || 'item'} when Curator preference is set to another user`;
      e.preventDefault();
      e.stopImmediatePropagation();
      this.element.dispatchEvent(
        new CustomEvent('toast', { detail: { errors: [mesg] }, bubbles: true })
      );
    }
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