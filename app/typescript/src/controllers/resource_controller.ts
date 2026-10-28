import type { Resource, ResourceFilters, VisitorsSourceData } from '../lib';
import { Stories, Deals, Contributions, PromotedStories, Visitors, Activity } from '../lib';
import { Controller } from "@hotwired/stimulus";
import { convertCase } from '../utils';

export default class ResourceController extends Controller<HTMLElement> {
  static values = {
    init: { type: Boolean, default: false },
    dataPath: String,
    filters: { type: Object },
    displayOptionsHtml: String,
  };
  static targets = ['searchSelect', 'displayOptionsButton'];
  
  declare filtersValue: ResourceFilters;
  declare readonly displayOptionsButtonTarget: HTMLButtonElement;

  protected declare resource: Resource
  protected declare readonly initValue: boolean;
  protected declare readonly dataPathValue: string;
  protected declare readonly searchSelectTarget: TomSelectInput;
  protected declare readonly hasDisplayOptionsButtonTarget: boolean;
  protected declare readonly displayOptionsHtmlValue: string;  

  get resourceName() {
    return convertCase(this.element.id, 'camel') as ResourceName;
  }
  
  get displayOptionsTitle() {
    return 'Display Preferences';
  }

  initialize() {
    this.resource = (() => {
      // console.log(`Initializing resource controller ${this.identifier}...`)
      switch (this.identifier) {
        case 'stories': return new Stories(this.element);
        case 'contributions': return new Contributions(this.element);
        case 'customer-wins': return new Deals(this.element);
        case 'promoted-stories': return new PromotedStories(this.element);
        case 'visitors': return new Visitors(this.element);
        case 'activity': return new Activity(this.element);
        default: throw new Error('Unable to determine Resource type');
      }
    })();
  }
  
  connect() {
    // console.log(`Connecting ${this.identifier}...`)
    if (this.hasDisplayOptionsButtonTarget) {
      this.resource.initDisplayOptions(this.displayOptionsButtonTarget, this.displayOptionsHtmlValue);
    }
  }

  async initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;

    // console.log(`Initializing resource ${this.identifier}...`)
    this.dispatch('loading');
    const data = await this.resource.init(this.dataPathValue);
    this.setAppData(data);
    this.dispatch('ready')
  }

  setAppData(data: SourceData[] | VisitorsSourceData) {
    if (this.resourceName === 'storyContributions') {
      CSP[this.resourceName][+(this.element.dataset.storyId as string)] = data as SourceData[];
    } else {
      CSP[this.resourceName] = data;
    } 
  }

  filtersValueChanged(_filters: ResourceFilters, _prevFilters: ResourceFilters) {
  }

  handleTomselectSearched(_e: CustomEvent) {
  }

  handleSearchSelectChanged(_e: CustomEvent<{ id: string, kind: string }>) {
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