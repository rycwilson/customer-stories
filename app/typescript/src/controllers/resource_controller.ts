import { Controller } from "@hotwired/stimulus";
import type DashboardController from "./dashboard_controller";
import { getJSON, kebabize } from '../utils';
import { 
  init as initTable,
  initComplete as tableInitComplete,
  search as searchTable
} from '../tables.js';
import { tableConfig as customerWinsTableConfig, newCustomerWinPath } from '../customer_wins/customer_wins';
import { tableConfig as contributorsTableConfig, newContributionPath } from '../contributions/contributions';
import { tableConfig as promotedStoriesTableConfig } from '../promoted_stories/promoted_stories';
import type { Api, Config } from "datatables.net-bs";

export default class ResourceController extends Controller<HTMLDivElement> {
  static outlets = ['dashboard', 'resource'];
  declare readonly dashboardOutlet: DashboardController;
  declare readonly resourceOutlets: ResourceController[];
  declare readonly hasResourceOutlet: boolean;

  static targets = [
    'curatorSelect', 
    'filterSelect', 
    'filterResults',
    'newItemBtn', 
    'tableDisplayOptionsBtn',
    'datatable'
  ];
  declare readonly curatorSelectTarget: TomSelectInput;
  declare readonly filterSelectTarget: TomSelectInput;
  declare readonly filterResultsTarget: HTMLDivElement;
  declare readonly datatableTarget: HTMLDivElement;
  declare readonly newItemBtnTarget: HTMLButtonElement;
  declare readonly tableDisplayOptionsBtnTarget: HTMLButtonElement;
  
  static values = {
    dataPath: String,
    searchParams: { type: String, default: '' },
    init: { type: Boolean, default: false },
    checkboxFilters: { type: Object, default: {} },
    invitationTemplateSelectHtml: { type: String, default: '' }
  }
  declare readonly dataPathValue: string;
  declare readonly searchParamsValue: string;
  declare readonly initValue: boolean;
  declare checkboxFiltersValue: { [inputId: string]: { checked: boolean, label: string }};
  declare readonly invitationTemplateSelectHtmlValue: string;

  // dt is defined when the table is initialized
  // declare dt instead of initializing it to avoid having to allow for undefined value
  // if the table fails to initialize, errors will be handled in the datatable controller
  declare dt: Api<any>;
  
  connect() {
    // console.log(`connect ${this.resourceName}`)
  }

  get resourceName() {
    return this.element.dataset.resourceName as ResourceName;
  }

  get dataExists() {
    return this.resourceName === 'storyContributions' ?
      CSP[this.resourceName][+(this.element.dataset.storyId as string)] :
      CSP[this.resourceName];
  }

  initValueChanged(shouldInit: boolean) {
    if (shouldInit) {
      if (this.dataExists) {
        // console.log('init table (data exists): ', this.resourceName)
        initTable(this);
      } else {
        this.dispatch('loading');
        getJSON(this.dataPathValue, this.searchParamsValue).then(data => {
          if (this.resourceName === 'storyContributions') {
            CSP[this.resourceName][+(this.element.dataset.storyId as string)] = data;
          } else {
            CSP[this.resourceName] = data;
          }
          // console.log('init table (data was fetched): ', this.resourceName)
          initTable(this);
        })
      }
    }
  }

  onTableInitComplete(e: CustomEvent) {
    tableInitComplete(this, e.detail.dt);
  }

  onTomselectSearch(e: CustomEvent) {
    searchTable(this, e, this.resourceOutlets);
  }

  onChangeCurator(e: CustomEvent) {
    if (this.resourceName && /customerWins|contributions/.test(this.resourceName)) {
      this.updateNewItemPath();
    }
    searchTable(this, e, this.resourceOutlets);
  }

  onChangeFilter(e: CustomEvent) {
    if (this.resourceName && /customerWins|contributions/.test(this.resourceName)) {
      this.updateNewItemPath();
      this.resourceOutlets.forEach(outlet => {
        if (/storyContributions|promotedStories/.test(outlet.resourceName)) return;
        outlet.updateNewItemPath();
      });
    } 
    searchTable(this, e, this.resourceOutlets);
  }
  
  checkboxFiltersValueChanged(newVal: object, oldVal: object) {
    if (Object.keys(oldVal).length === 0) return false;
    searchTable(this);
  }

  tableConfig(): Config | undefined {
    switch (this.resourceName) {
      case 'customerWins':
        return customerWinsTableConfig();
      case 'contributions':
        return contributorsTableConfig(this.invitationTemplateSelectHtmlValue);
      case 'stories':
        return undefined;
      case 'storyContributions':
        return contributorsTableConfig(this.invitationTemplateSelectHtmlValue, +(this.element.dataset.storyId as string));
      case 'promotedStories':
        return promotedStoriesTableConfig();
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