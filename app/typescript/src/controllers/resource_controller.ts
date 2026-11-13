import type { Resource, ResourceFilters, VisitorsSourceData } from '../lib';
import { Stories, Deals, Contributions, PromotedStories, Visitors, Activity } from '../lib';
import { Controller } from "@hotwired/stimulus";
import { convertCase } from '../utils';
import Cookies from 'js-cookie';

export default class ResourceController extends Controller<HTMLElement> {
  static values = {
    init: { type: Boolean, default: false },
    dataPath: String,
    filters: { type: Object, default: {} },
    filtersHtml: String,
    preferencesHtml: String
  };
  static targets = [
    'searchSelect',
    'filtersButton',
    'filtersPopover',
    'filterControl',
    'preferencesButton',
    'preferencesPopover',
  ];
  
  protected declare filtersValue: ResourceFilters;
  declare readonly filtersButtonTarget: HTMLButtonElement;
  declare readonly filtersPopoverTarget: HTMLDivElement;
  declare readonly hasFiltersPopoverTarget: boolean;
  declare readonly filterControlTargets: (TomSelectInput | HTMLInputElement)[];
  declare readonly preferencesButtonTarget: HTMLButtonElement;
  declare readonly preferencesPopoverTarget: HTMLDivElement;
  declare readonly hasPreferencesPopoverTarget: boolean;
  declare readonly hasTableTarget: boolean;
  
  protected declare resource: Resource
  protected declare readonly initValue: boolean;
  protected declare readonly dataPathValue: string;
  protected declare readonly searchSelectTarget: TomSelectInput;
  protected declare readonly filtersHtmlValue: string;
  protected declare readonly hasFiltersButtonTarget: boolean;
  protected declare readonly preferencesHtmlValue: string;  
  protected declare readonly hasPreferencesButtonTarget: boolean;

  protected onPopoverShown = this.handlePopoverShown.bind(this);
  protected onPopoverLostFocus = this.handlePopoverLostFocus.bind(this);
  protected initialized = false;

  get resourceName() {
    return convertCase(this.element.id, 'camel') as ResourceName;
  }

  get popover() {
    if (this.hasFiltersPopoverTarget) return this.filtersPopoverTarget;
    else if (this.hasPreferencesPopoverTarget) return this.preferencesPopoverTarget;
  }

  get popoverButton() {
    return this.popover ? $(this.popover).data('bs.popover').$element[0] : undefined;
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
    if (this.hasFiltersButtonTarget) {
      this.resource.initDisplayOptions('Filters', this.filtersButtonTarget, this.filtersHtmlValue);
      $(this.filtersButtonTarget).on('shown.bs.popover', this.onPopoverShown);
    }
    if (this.hasPreferencesButtonTarget) {
      this.resource.initDisplayOptions('Preferences', this.preferencesButtonTarget, this.preferencesHtmlValue);
      $(this.preferencesButtonTarget).on('shown.bs.popover', this.onPopoverShown);
    }

    // Use capture to ensure that any other event handlers that may stop propagation
    // (e.g. column sorting on datatables) do not prevent this from firing.
    if (this.hasFiltersButtonTarget || this.hasPreferencesButtonTarget) {
      document.addEventListener('click', this.onPopoverLostFocus, true);
    }
  }

  disconnect() {
    if (this.hasFiltersButtonTarget) {
      $(this.filtersButtonTarget).off('shown.bs.popover', this.onPopoverShown);
    }
    if (this.hasPreferencesButtonTarget) {
      $(this.preferencesButtonTarget).off('shown.bs.popover', this.onPopoverShown);
    }
    if (this.hasFiltersButtonTarget || this.hasPreferencesButtonTarget) {
      document.removeEventListener('click', this.onPopoverLostFocus, true);
    }
  }

  async initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;

    // console.log(`Initializing resource ${this.identifier}...`)
    this.dispatch('loading');
    const data = await this.resource.init(this.dataPathValue);
    this.initialized = true;
    this.setAppData(data);
    this.dispatch('ready');
  }

  setAppData(data: SourceData[] | VisitorsSourceData) {
    if (this.resourceName === 'storyContributions') {
      CSP[this.resourceName][+(this.element.dataset.storyId as string)] = data as SourceData[];
    } else {
      CSP[this.resourceName] = data;
    } 
  }

  filtersValueChanged(_filters: ResourceFilters, _prevFilters: ResourceFilters) {
    if (!this.initialized) return;
  }

  handlePopoverShown({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    // const popover = $(button).data('bs.popover').$tip[0];
    // Wait for tomselect to initialize
    setTimeout(() => {
      if (this.hasFiltersButtonTarget && button === this.filtersButtonTarget) this.setFilters();
      else if (this.hasPreferencesButtonTarget) this.setPreferences();
    })
  }

  setFilters() {
    if (!this.popover) return;

    for (const [key, value] of Object.entries(this.filtersValue)) {
      // Skip dashboard filters e.g. curator. These will appear in Preferences.
      if ((this.resource.constructor as typeof Resource).filtersKeys.includes(key as keyof ResourceFilters)) {
        const control = <TomSelectInput | HTMLInputElement>this.popover
          .querySelector(`[name="${this.identifier}-${key}"]`);
        if (control.type === 'checkbox') {
          control.checked = value;
        } else {
          control.tomselect.setValue(value, true);
        }
      }
    }
  }

  setPreferences() {
    if (!this.popover) return;

    const curatorSelect = <TomSelectInput>this.popover.querySelector(`[name="${this.identifier}-curator"]`);
    curatorSelect.tomselect.setValue(this.filtersValue.curator ?? '', true);
  }

  handlePopoverLostFocus(e: PointerEvent) {
    if (
      this.popover &&
      e.target instanceof Node &&
      !this.popover.contains(e.target) && 
      !this.popoverButton.contains(e.target)
    ) {
      this.popoverButton.click();
    }
  }

  hidePopover() {
    this.popoverButton?.click();
  }

  handleFilterChanged({ target }: { target: TomSelectInput | HTMLInputElement }) {
    let key: string, value: string | boolean | null;
    switch (target.type) {
      case 'checkbox':
        key = target.id;
        value = target.checked;
        break;
      default:
        key = convertCase(target.dataset.tomselectKindValue, 'kebab');
        value = key === 'curator' ? +target.value || null : target.value;
    }
    const filter = { [key]: value };
    if (Object.hasOwn(filter, 'curator')) {
      this.dispatch('dashboard-filter-changed', { detail: filter, prefix: '' });
    } else {
      this.filtersValue = Object.fromEntries(
        Object.entries({ ...this.filtersValue, ...filter }).filter(([_key, value]) => value)
      );
      if (value) {
        Cookies.set(`${this.identifier}-${key}-filter`, value.toString());
      } else {
        Cookies.remove(`${this.identifier}-${key}-filter`);
      }
    }
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