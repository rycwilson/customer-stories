import { Controller } from "@hotwired/stimulus";
import { getJSON } from '../utils';
import { init as initTable, initDisplayOptions, search as searchTable } from '../tables';
import type { Api } from "datatables.net-bs";

export default class ResourceController extends Controller<HTMLElement> {
  static outlets = ['dashboard'];

  static targets = [
    'searchSelect', 
    'filterResults',
    'displayOptionsBtn',
    'datatable'
  ];
  declare readonly searchSelectTarget: TomSelectInput;
  declare readonly filterResultsTarget: HTMLDivElement;
  declare readonly datatableTarget: HTMLDivElement;
  declare readonly displayOptionsBtnTarget: HTMLButtonElement;
  declare readonly hasDisplayOptionsBtnTarget: boolean;
  
  static values = {
    dataPath: String,
    init: { type: Boolean, default: false },
    filters: { type: Object },
    displayOptionsHtml: String
  }
  declare readonly dataPathValue: string;
  declare readonly initValue: boolean;
  declare filtersValue: ResourceFilters;
  declare readonly displayOptionsHtmlValue: string;

  declare dt: Api<any> | undefined;
  
  connect() {
    // console.log('connect resource', this.identifier)
    if (this.hasDisplayOptionsBtnTarget) {
      initDisplayOptions.call(this);
    }
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

  initValueChanged(shouldInit: boolean) {
    if (shouldInit) {
      if (this.dataExists) {
        initTable.call(this);
      } else {
        this.dispatch('loading');
        // console.log('getting data:', this.dataPathValue)
        getJSON(this.dataPathValue).then(data => {
          if (this.resourceName === 'storyContributions') {
            CSP[this.resourceName][+(this.element.dataset.storyId as string)] = data;
          } else {
            CSP[this.resourceName] = data;
          }
          initTable.call(this);
        })
      }
    }
  }

  onTableInitComplete(e: CustomEvent) {
    this.dt = e.detail.dt;
    setTimeout(() => {
      (this.dt as Api<any>).one('draw', () => {
        // console.log('draw after init:', this.resourceName)
        this.dispatch('ready', { detail: { resourceName: this.resourceName } });
      })
      searchTable.call(this);
    });
  }

  onTomselectSearch(e: CustomEvent) {
    if (this.dt) {
      searchTable.call(this, e.detail.searchResults);
    }
  }

  onChangeSearchSelect(e: CustomEvent) {
    // this.addSyncListener((ctrl) => ctrl.searchSelectTarget.tomselect.setValue(this.searchSelectTarget.value));
    if (this.dt) {
      searchTable.call(this);
    }
  }
  
  filtersValueChanged(newVal: ResourceFilters, oldVal: ResourceFilters) {
    // console.log(`old ${this.identifier} filtersValue:`, oldVal)
    // console.log(`new ${this.identifier} filtersValue:`, newVal)
    // if (newVal['curator'] !== oldVal['curator']) {
    //   this.addSyncListener((ctrl) => (
    //     ctrl.filtersValue = { ...ctrl.filtersValue, ...{ 'curator': this.filtersValue['curator'] } }
    //   ));
    // }
    if (this.dt) {
      if (Object.keys(oldVal).length === 0) return;
      searchTable.call(this);
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