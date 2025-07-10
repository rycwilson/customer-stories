import { Controller } from "@hotwired/stimulus";
import type CustomerWinsController from "./customer_wins_controller";
import type ContributionsController from "./contributions_controller";
import type PromotedStoriesController from "./promoted_stories_controller";
// import type VisitorsController from "./visitors_controller";
// import type ActivityController from "./activity_controller";
import { getJSON, kebabize } from '../utils';
import { init as initTable, initDisplayOptions as initTableDisplayOptions, search as searchTable } from '../tables.js';
import type { Api, Config } from "datatables.net-bs";

// type SubclassController = CustomerWinsController | ContributionsController | PromotedStoriesController;
type FiltersValue = { [key: string]: boolean | number | null };

export default class ResourceController extends Controller<HTMLElement> {
  static outlets = ['customer-wins', 'contributions', 'promoted-stories'];
  declare readonly customerWinsOutlet: CustomerWinsController;
  declare readonly hasCustomerWinsOutlet: boolean;
  declare readonly contributionsOutlet: ContributionsController;
  declare readonly hasContributionsOutlet: boolean;
  declare readonly promotedStoriesOutlet: PromotedStoriesController;
  declare readonly hasPromotedStoriesOutlet: boolean;

  static targets = [
    'searchSelect', 
    'filterResults',
    'newItemBtn', 
    'displayOptionsBtn',
    'datatable'
  ];
  declare readonly searchSelectTarget: TomSelectInput;
  declare readonly filterResultsTarget: HTMLDivElement;
  declare readonly datatableTarget: HTMLDivElement;
  declare readonly newItemBtnTarget: HTMLButtonElement;
  declare readonly displayOptionsBtnTarget: HTMLButtonElement;
  
  static values = {
    dataPath: String,
    searchParams: { type: String, default: '' },
    init: { type: Boolean, default: false },
    filters: { type: Object, default: {} },
    displayOptionsHtml: String
  }
  declare readonly dataPathValue: string;
  declare readonly searchParamsValue: string;
  declare readonly initValue: boolean;
  declare filtersValue: FiltersValue;
  declare readonly displayOptionsHtmlValue: string;

  // dt is defined when the table is initialized
  // declare dt instead of initializing it to avoid having to allow for undefined value
  // if the table fails to initialize, errors will be handled in the datatable controller
  declare dt: Api<any>;
  
  connect() {
    // console.log('connect resource', this.identifier)
  }

  get resourceName() {
    return this.element.dataset.resourceName as ResourceName;
  }

  get resourceOutlets(): (CustomerWinsController | ContributionsController | PromotedStoriesController)[] {
    const outlets = [];
    if (this.hasCustomerWinsOutlet) outlets.push(this.customerWinsOutlet);
    if (this.hasContributionsOutlet) outlets.push(this.contributionsOutlet);
    if (this.hasPromotedStoriesOutlet) outlets.push(this.promotedStoriesOutlet);
    return outlets;
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
        // console.log('getting data:', this.dataPathValue, this.searchParamsValue || 'no params')
        getJSON(this.dataPathValue, this.searchParamsValue).then(data => {
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
    initTableDisplayOptions.call(this);
    setTimeout(() => {
      this.dt.one('draw', () => {
        // console.log('draw after init:', this.resourceName)
        this.dispatch('ready', { detail: { resourceName: this.resourceName } });
      })
      searchTable.call(this);
    });
  }

  onTomselectSearch(e: CustomEvent) {
    searchTable.call(this, e.detail.searchResults);
  }

  // onChangeCurator(e: CustomEvent) {
  //   if (this.resourceName && /customerWins|contributions/.test(this.resourceName)) {
  //     // this.updateNewItemPath();
  //   }
  //   searchTable.call(this, e);
  // }

  onChangeSearchSelect(e: CustomEvent) {
    // if (this.resourceName && /customerWins|contributions/.test(this.resourceName)) {
    //   this.updateNewItemPath();
    //   this.resourceOutlets.forEach(outlet => {
    //     if (/storyContributions|promotedStories/.test(outlet.resourceName)) return;
    //     outlet.updateNewItemPath();
    //   });
    // } 
    this.addSyncListener((ctrl) => ctrl.searchSelectTarget.tomselect.setValue(this.searchSelectTarget.value));
    searchTable.call(this);
  }
  
  filtersValueChanged(newVal: FiltersValue, oldVal: FiltersValue) {
    // console.log('old filtersValue:', oldVal)
    // console.log('new filtersValue:', newVal)
    if (Object.keys(oldVal).length === 0) return false;
    if (newVal['curator-id'] !== oldVal['curator-id']) {
      this.addSyncListener((ctrl) => (
        ctrl.filtersValue = { ...ctrl.filtersValue, ...{ 'curator-id': this.filtersValue['curator-id'] } }
      ));
    }
    searchTable.call(this);
  }
  
  addSyncListener(syncResource: (ctrl: ResourceController) => void) {
    this.element.addEventListener('datatable:drawn', () => {
      this.resourceOutlets.forEach(ctrl => {
        // console.log('syncing:', ctrl.resourceName);
        if (ctrl['dt']) setTimeout(() => syncResource(ctrl));   // dt exists if the table has loaded
      });
    }, { once: true });
  }

  // updateNewItemPath() {
  //   const filterVal = this.searchSelectTarget.value;
  //   const type = filterVal && filterVal.slice(0, filterVal.lastIndexOf('-'));
  //   const id = filterVal && filterVal.slice(filterVal.lastIndexOf('-') + 1, filterVal.length);
  //   const customerWinId = type === 'success' ? id : '';
  //   const params = new URLSearchParams();
  //   params.set('curator_id', this.curatorSelectTarget.value);
  //   if (filterVal) params.set(`${type}_id`, id);
  //   this.newItemBtnTarget.setAttribute(
  //     'data-modal-trigger-turbo-frame-attrs-value',
  //     JSON.stringify({ 
  //       id: `new-${kebabize(this.resourceName)}`.slice(0, -1),  // remove the trailing 's' 
  //       src: (() => {
  //         switch (this.resourceName) {
  //           case 'customerWins':
  //             return newCustomerWinPath(params);
  //           case 'contributions':
  //             return newContributionPath(customerWinId, params);
  //           default: 
  //             return '';
  //         }
  //       })()
  //     })
  //   );
  // }

}