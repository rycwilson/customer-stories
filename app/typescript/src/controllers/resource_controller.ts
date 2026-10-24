import type { 
  Resource,
  ResourceFilters,
  VisitorsSourceData,
  VisitorsFilters } from '../lib';
import { Stories, Deals, Contributions, PromotedStories, Visitors } from '../lib';
import { Controller } from "@hotwired/stimulus";
import { convertCase } from '../utils';

export default class ResourceController extends Controller<HTMLDivElement> {
  static outlets = ['dashboard'];
  static values = {
    init: { type: Boolean, default: false },
    dataPath: String,
    filters: { type: Object },
    displayOptionsHtml: String,
  };
  static targets = [
    'searchSelect',
    'displayOptionsButton',
    'columnChart',
    'tableChart'
  ];
  
  declare filtersValue: ResourceFilters;
  declare readonly displayOptionsButtonTarget: HTMLButtonElement;

  protected declare resource: Resource
  protected declare readonly initValue: boolean;
  protected declare readonly dataPathValue: string;
  protected declare readonly dashboardOutlet: import('.').DashboardController;
  protected declare readonly searchSelectTarget: TomSelectInput;
  protected declare readonly hasDisplayOptionsButtonTarget: boolean;
  protected declare readonly displayOptionsHtmlValue: string;  
  
  declare readonly columnChartTarget: HTMLElement | undefined;
  declare readonly tableChartTarget: HTMLElement | undefined;

  get resourceName() {
    return convertCase(this.element.id, 'camel') as ResourceName;
  }
  
  get displayOptionsTitle() {
    return 'Display Preferences';
  }

  connect() {
    this.resource = (() => {
      // TODO: resourceName can be replaced with this.element.id
      switch (this.element.dataset.resourceName) {
        case 'stories': return new Stories(this.element);
        case 'contributions': return new Contributions(this.element);
        case 'customerWins': return new Deals(this.element);
        case 'promotedStories': return new PromotedStories(this.element);
        case 'visitors': return new Visitors(this.element);
        default: throw new Error('Resource name is missing');
      }
    })();

    if (this.hasDisplayOptionsButtonTarget) {
      this.resource.initDisplayOptions(this.displayOptionsButtonTarget, this.displayOptionsHtmlValue);
    }
  }

  async initValueChanged(shouldInit: boolean, calledFromSubclass: boolean = false) {
    if (!shouldInit) return;

    this.dispatch('loading');
    const optional = this.resourceName === 'visitors' ?
      [this.filtersValue, this.columnChartTarget!, this.tableChartTarget!] : 
      [];
    const data = await this.resource.init(this.dataPathValue, ...optional);
    this.setAppData(data);
    if (!calledFromSubclass) {
      this.dispatch('ready', { detail: { resourceName: this.resourceName } })
    }
  }

  setAppData(data: SourceData[] | VisitorsSourceData) {
    if (this.resourceName === 'storyContributions') {
      CSP[this.resourceName][+(this.element.dataset.storyId as string)] = data as SourceData[];
    } else {
      CSP[this.resourceName] = data;
    } 
  }

  filtersValueChanged(filters: ResourceFilters) {
    if (this.resourceName === 'visitors') {
      (this.resource as Visitors).handleFiltersChanged(filters as VisitorsFilters);
    }
  }

  handleTomselectSearched(_e: CustomEvent) {
  }

  handleSearchSelectChanged(e: CustomEvent<{ id: string, kind: string }>) {
    if (this.element.id === 'visitors') {
      const { id: filter } = e.detail;
      const filters = this.filtersValue as VisitorsFilters;
      if (filter) {
        const [filterKey, filterVal] = filter.split('-');
        this.filtersValue = { ...filters, ...{ [filterKey]: +filterVal } };
      } else {
        const { story: _s, category: _c, product: _p, ...rest } = filters;
        this.filtersValue = rest;
      }
    }
  }
  
  validateNewItem(e: Event) {
    const button = <HTMLButtonElement>e.currentTarget;
    if (this.filtersValue.curator && this.filtersValue.curator !== CSP.currentUser!.id) {
      const label = button?.ariaLabel?.match(/^New (?<label>.+)$/)?.groups?.label;
      const mesg = `Can't add a new ${label || 'item'} when Curator preference is set to another user`;
      e.preventDefault();
      e.stopImmediatePropagation();
      this.element.dispatchEvent(
        new CustomEvent('toast', { detail: { errors: [mesg] }, bubbles: true })
      );
    }
  }
}