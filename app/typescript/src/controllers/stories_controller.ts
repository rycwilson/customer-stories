import { type FrameElement } from '@hotwired/turbo';
import type { Stories, StoriesFilters } from '../lib';
import Cookies from 'js-cookie';
import { imagesLoaded, shallowEqual } from '../utils';
import ResourceController from './resource_controller';

// The stories "table" is a gallery of cards in a turbo frame, so there is no datatable to
// initialize. Filters live in a popover (see `display-options`) and, along with the search
// string, are translated to the turbo frame's `src` query params.
export default class StoriesController extends ResourceController {
  static targets = [
    ...super.targets,
    'turboFrame',
    'gallery',
    'card',
    'searchInput',
    'activeFiltersCount',
    'results'
  ];
  static values = { 
    ...ResourceController.values,
    filtersMatchType: { type: String, default: 'all' } 
  };

  protected declare filtersValue: StoriesFilters;

  private declare readonly turboFrameTarget: FrameElement;
  private declare readonly galleryTarget: HTMLUListElement;
  private declare readonly cardTargets: HTMLDivElement[];
  private declare readonly searchInputTarget: HTMLInputElement;
  private declare readonly activeFiltersCountTarget: HTMLSpanElement;
  private declare filtersMatchTypeValue: 'all' | 'any';
  private searchString = '';
  private silentClear = false;
  private hasSearchResults = false;

  get cardImages() {
    return this.cardTargets.map(card => card.querySelector('img')).filter(card => !!card);
  }

  get activeFiltersCount() {
    const filters = Object.keys(this.filtersValue).filter((key): key is keyof StoriesFilters => (
      (this.resource.constructor as typeof Stories)
        .filtersKeys
        .includes(key as keyof StoriesFilters)
    ));
    return filters.length;
  }

  get turboFrameSource() {
    let searchEntries, filtersEntries;
    if (this.searchString) {
      searchEntries = [['q', this.searchString]];
    } else {
      filtersEntries =
        Object.entries(this.filtersValue).map(([key, value]) => [key, String(value ?? '')]);
      if (filtersEntries.length > 1) {
        filtersEntries.push(['match_type', this.filtersMatchTypeValue]);
      }
    }
    const searchParams = new URLSearchParams(searchEntries || filtersEntries);
    return `${this.dataPathValue}?${searchParams.toString()}`;
  }

  async initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;
  
    // console.log('initializing stories')
    this.dispatch('loading');
    await this.loadTurboFrame();
    this.initialized = true;
    this.dispatch('ready');
  }

  loadTurboFrame() {
    // this.galleryTarget.classList.add('hidden');
    return new Promise<void>(resolve => {
      this.turboFrameTarget.addEventListener(
        'turbo:frame-render',
        this.handleFrameRendered.bind(this, resolve),
        { once: true }
      );
      console.log(`loading stories from ${this.turboFrameSource}`)
      this.turboFrameTarget.src = this.turboFrameSource;
    });
  }

  async handleFrameRendered(resolve: VoidFunction, _e: Event) {
    await imagesLoaded(this.cardImages);
    this.galleryTarget.classList.remove('hidden');
    this.activeFiltersCountTarget.textContent = 
      this.activeFiltersCount ? `\u00a0(${this.activeFiltersCount})` : '';
    resolve();
  }

  toggleView() {

  }

  clearSearch() {
    this.searchString = '';
    this.searchInputTarget.value = '';
    this.hasSearchResults = false;
  }

  setFilters() {
    if (!this.popover) return;
    
    super.setFilters();
    const matchTypeRadio = <HTMLInputElement>this.popover.querySelector(
      `[name="${this.identifier}-match-type"][value="${this.filtersMatchTypeValue}"]`
    )
    matchTypeRadio.checked = true;
  }

  clearFilters() {
    const newFilters = { ...this.filtersValue };
    (this.resource.constructor as typeof Stories).filtersKeys.forEach(key => {
      delete newFilters[key as keyof StoriesFilters];
      Cookies.remove(`stories-${key}-filter`);
    });
    if (this.popover) {
      this.filterControlTargets.forEach(control => control.tomselect?.clear(true));
    }
    this.filtersValue = newFilters;
  }

  handleSearchInput({ target: _input }: { target: HTMLInputElement }) {
  }

  async handleSearchSubmitted(e: Event) {
    e.preventDefault();
    const searchString = this.searchInputTarget.value.trim();
    if (!searchString && !this.hasSearchResults) return;

    this.searchString = searchString;
    if (this.activeFiltersCount) {
      this.silentClear = true;
      this.clearFilters();
    }
    await this.loadTurboFrame();
    this.hasSearchResults = true;
  }

  async filtersValueChanged(filters: StoriesFilters, prevFilters: StoriesFilters) {
    if (!this.initialized) return;
    if (shallowEqual<StoriesFilters>(filters, prevFilters)) return;
    if (this.silentClear) {
      this.silentClear = false;
      return;
    }

    this.clearSearch();
    await this.loadTurboFrame();
  }

  async handleFiltersMatchTypeChanged({ target: { value } }: { target: { value: 'all' | 'any' } }) {
    this.filtersMatchTypeValue = value;
    Cookies.set('dashboard-stories-filters-match-type', value);
    if (this.activeFiltersCount > 1) {
      await this.loadTurboFrame();
    }
  }
}
