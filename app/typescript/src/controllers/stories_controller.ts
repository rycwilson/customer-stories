import { type FrameElement } from '@hotwired/turbo';
import { type StoriesFilters } from '../lib';
import Cookies from 'js-cookie';
import { waitForImages } from '../utils';
import ResourceController from './resource_controller';
import {
  STORY_FILTER_KEYS,
  activeFilterCount,
  buildStoriesParams,
  haveSameActiveFilters } from '../utils/stories_filters';

// The stories "table" is a gallery of cards in a turbo frame, so there is no datatable to
// initialize. Filters live in a popover (see `display-options`) and, along with the search
// string, are translated to the turbo frame's `src` query params.
export default class StoriesController extends ResourceController {
  static targets = ['turboFrame', 'gallery', 'card', 'searchInput', 'filtersCount', 'results'];
  static values = { 
    ...ResourceController.values,
    matchType: { type: String, default: 'all' } 
  };

  declare readonly turboFrameTarget: FrameElement;
  declare readonly galleryTarget: HTMLUListElement;
  declare readonly hasGalleryTarget: boolean;
  declare readonly cardTargets: HTMLDivElement[];
  declare readonly searchInputTarget: HTMLInputElement;
  declare readonly filtersCountTarget: HTMLSpanElement;
  declare readonly resultsTarget: HTMLSpanElement;

  declare matchTypeValue: 'all' | 'any';
  declare filtersValue: StoriesFilters;

  get displayOptionsTitle() {
    return 'Filters';
  }

  get cardImages() {
    return this.cardTargets.map(card => card.querySelector('img')).filter(card => !!card);
  }

  get turboFrameSource() {
    const filtersEntries = Object.entries(this.filtersValue).map(([key, value]) => (
      [key, value?.toString() ?? '']
    ));
    const searchParams = new URLSearchParams(filtersEntries);
    if (filtersEntries.length > 1) {
      searchParams.set('match_type', this.matchTypeValue);
    } 
    return `${this.dataPathValue}?${searchParams.toString()}`;
  }

  searchString = '';
  private filtersInitialized = false;

  async initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;
  
    await this.loadTurboFrame(async (resolve, _e: Event) => {
      await waitForImages(this.cardImages);
      this.galleryTarget.classList.remove('hidden');
      resolve();
    })
    this.dispatch('ready');
  }

  loadTurboFrame(onFrameRendered: (resolve: VoidFunction, e: Event) => void) {
    this.dispatch('loading');
    return new Promise<void>(resolve => {
      this.turboFrameTarget
        .addEventListener('turbo:frame-render', onFrameRendered.bind(this, resolve), { once: true })
      this.turboFrameTarget.src = this.turboFrameSource;
    });
  }

  handleFrameRendered(_e: Event) {
    // console.log('turbo:frame-render')
  }

  fetchStories() {
    const params = buildStoriesParams(this.filtersValue, this.searchString, this.matchTypeValue);
    const src = `/?${params}`;
    if (src !== this.turboFrameTarget.getAttribute('src')) this.turboFrameTarget.src = src;
  }

  clearSearch(e: Event | undefined = undefined) {
    this.searchString = '';
    this.searchInputTarget.value = '';
    this.searchInputTarget.form?.classList.remove('has-query');
    const isUserInput = Boolean(e);
    if (isUserInput) this.fetchStories();
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
      this.fetchStories();
    }
  }

  clearFilters() {
    // const hadCurator = Boolean(this.filtersValue.curator);
    this.filtersValue = {};
    // the curator should be actively "blank", not just removed
    STORY_FILTER_KEYS.forEach(key => Cookies.set(`csp-${key}-filter`, ''));
    // if (hadCurator) this.dashboardOutlet.filtersValue = { curator: null };
  }

  filtersValueChanged(filters: StoriesFilters, prevFilters: StoriesFilters) {
    const count = activeFilterCount(filters);
    this.filtersCountTarget.textContent = count ? ` (${count})` : '';

    // The initial filters are already reflected in the server-rendered frame src
    if (!this.filtersInitialized) {
      this.filtersInitialized = true;
      return;
    }
    if (haveSameActiveFilters(filters, prevFilters)) return;
    if (count) this.clearSearch();
    this.fetchStories();
  }

  matchTypeValueChanged(newVal: string, oldVal: string | undefined) {
    if (this.filtersInitialized && newVal !== oldVal && activeFilterCount(this.filtersValue) > 1) {
      this.fetchStories();
    }
  }
}
