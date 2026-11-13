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

  declare readonly turboFrameTarget: FrameElement;
  declare readonly galleryTarget: HTMLUListElement;
  declare readonly hasGalleryTarget: boolean;
  declare readonly cardTargets: HTMLDivElement[];
  declare readonly searchInputTarget: HTMLInputElement;
  declare readonly activeFiltersCountTarget: HTMLSpanElement;
  declare readonly resultsTarget: HTMLSpanElement;

  declare filtersMatchTypeValue: 'all' | 'any';
  declare filtersValue: StoriesFilters;

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
    const filtersEntries = Object.entries(this.filtersValue).map(([key, value]) => (
      [key, String(value ?? '')]
    ));
    const searchParams = new URLSearchParams(filtersEntries);
    if (filtersEntries.length > 1) {
      searchParams.set('match_type', this.filtersMatchTypeValue);
    } 
    return `${this.dataPathValue}?${searchParams.toString()}`;
  }

  searchString = '';

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
      console.log(`loading ${this.turboFrameSource}`)
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

  clearSearch(e?: Event) {
    this.searchString = '';
    this.searchInputTarget.value = '';
    this.searchInputTarget.form?.classList.remove('has-query');
    const isUserInput = Boolean(e);
    // if (isUserInput) this.fetchStories();
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
    });
    this.filterControlTargets.forEach(control => {
      control.tomselect?.clear(true);
      Cookies.remove(`${control.name}-filter`);
    });
    this.filtersValue = newFilters;
  }

  // Search and filters are mutually exclusive: searching clears the filters.
  handleSubmitSearch(e: Event) {
    e.preventDefault();
    const searchString = this.searchInputTarget.value.trim();
    if (!searchString) return this.clearSearch(e);

    this.searchString = searchString;
    this.searchInputTarget.form?.classList.add('has-query');
    if (activeFilterCount(this.filtersValue)) {
      this.clearFilters();    // fetches via filtersValueChanged
    } else {
      // this.fetchStories();
    }
  }

  async filtersValueChanged(filters: StoriesFilters, prevFilters: StoriesFilters) {
    if (!this.initialized) return;
    if (shallowEqual<StoriesFilters>(filters, prevFilters)) return;
    
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(this.filtersValue)) {
      params.set(key, String(value ?? ''));
    }
    if (this.activeFiltersCount > 1) params.set('match_type', this.filtersMatchTypeValue);

    // this.clearSearch();
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
