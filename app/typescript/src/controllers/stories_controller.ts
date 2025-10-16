import { Controller } from '@hotwired/stimulus';
import { type FrameElement } from '@hotwired/turbo';
import Cookies from 'js-cookie';
import imagesLoaded from 'imagesloaded';

export default class extends Controller<HTMLDivElement> {
  static targets = [
    'turboFrame',
    'gallery', 
    'card', 
    'searchAndFilters',   // one container for xs and sm, another for md and lg
    'searchInput',
    'searchString',
    'searchResults',
    'filterResults',
    'matchTypeInput',
    'filterSelect', 
  ];
  declare readonly turboFrameTarget: FrameElement;
  declare readonly galleryTarget: HTMLUListElement;
  declare readonly hasGalleryTarget: boolean;
  declare readonly cardTargets: HTMLDivElement[];
  declare readonly searchAndFiltersTarget: HTMLDivElement;
  declare readonly searchInputTarget: HTMLInputElement;
  declare readonly searchStringTarget: HTMLSpanElement;
  declare readonly searchResultsTarget: HTMLSpanElement;
  declare readonly filterResultsTarget: HTMLSpanElement;
  declare readonly matchTypeInputTargets: HTMLInputElement[];
  declare readonly filterSelectTargets: TomSelectInput[];

  static values = { filters: Object };
  declare filtersValue: { 'curator-id': string | null };
  
  readyFilters = 0;
  frameObserver = new MutationObserver((mutations) => {
    if (this.turboFrameTarget.hasAttribute('busy')) {
      this.dispatch('loading');
      this.frameObserver.disconnect();
    }
  });

  connect() {
    this.frameObserver.observe(this.turboFrameTarget, { attributes: true });
    this.turboFrameTarget.addEventListener('turbo:frame-render', this.onRenderStories.bind(this));
  }
  
  disconnect() {
    // no need for this since listener is attached to the frame (which will disappear along with its listeners when this disconnects)
    // document.documentElement.removeEventListener('turbo:frame-render', this.onGalleryRender.bind(this));
    this.frameObserver.disconnect();
  }
  
  get activeFilters() {
    return this.filterSelectTargets.filter(select => select.value);
  }
  
  get filterTypes() {
    return this.filterSelectTargets.map(select => select.dataset.tomselectKindValue).filter(type => type) as string[]; 
  }
  
  // TODO: before intial load, make sure all images on the page (namely the search icon) are loaded
  fetchStories(updateSearchParams: ((src: URL) => void) | undefined = undefined) {
    if (this.turboFrameTarget.src) {
      const newSrc = new URL(this.turboFrameTarget.src);
      if (updateSearchParams) updateSearchParams(newSrc);
      this.turboFrameTarget.src = newSrc.toString();
    }
  }

  clearSearch(e: CustomEvent | undefined = undefined) {
    const isUserInput = Boolean(e);
    this.searchInputTarget.value = '';
    this.searchAndFiltersTarget.classList.remove('has-search-results');
    if (isUserInput) {
      this.fetchStories((turboFrameSrc: URL) => turboFrameSrc.searchParams.delete('q'));
    }
  }

  clearFilters(e: CustomEvent | undefined = undefined) {
    if (this.activeFilters.length === 0) return;
    const isUserInput = Boolean(e);
    this.filterSelectTargets.forEach(select => select.tomselect.clear(true));
    if (isUserInput) {
      this.fetchStories((turboFrameSrc: URL) => {
        this.filterTypes.forEach(param => turboFrameSrc.searchParams.delete(param || ''));
      })
    } else {
      this.searchAndFiltersTarget.classList.remove('has-combined-results');
    }

    // the curator should be actively "blank", not just removed
    Cookies.set('csp-curator-filter', '') ;
    this.filterTypes.filter(type => type !== 'curator').forEach(type => Cookies.remove(`csp-${type}-filter`));
  }

  onInitFilter(e: Event) {
    if (++this.readyFilters === this.filterSelectTargets.length) {
      // this.searchAndFiltersTargets.forEach(container => container.setAttribute('data-init', 'true'));
      this.searchAndFiltersTarget.setAttribute('data-init', 'true');
    }
  }

  onChangeFilterMatchType({ target: input }: { target: EventTarget }) {
    if (!(input instanceof HTMLInputElement)) return;
    Cookies.set('csp-dashboard-filters-match-type', input.value);
    if (this.activeFilters.length) {
      this.fetchStories((turboFrameSrc: URL) => turboFrameSrc.searchParams.set('match_type', input.value));
    };
  }

  onSubmitSearch(e: Event) {
    e.preventDefault()
    this.clearFilters();
    this.fetchStories((turboFrameSrc: URL) => {
      for (const [param, value] of turboFrameSrc.searchParams.entries()) {
        turboFrameSrc.searchParams.delete(param);
      }
      turboFrameSrc.searchParams.set('q', this.searchInputTarget.value.trim());
    });
  }

  onChangeFilter(e: CustomEvent) {
    const { kind, id } = e.detail;
    this.clearSearch();
    this.fetchStories((turboFrameSrc: URL) => {
      if (id) {
        turboFrameSrc.searchParams.set(kind, id);
        turboFrameSrc.searchParams.delete('q');
      } else {
        turboFrameSrc.searchParams.delete(kind);
      }
      if (this.activeFilters.length > 1 && !turboFrameSrc.searchParams.get('match_type')) {
        turboFrameSrc.searchParams.set('match_type', this.matchTypeInputTargets.find(input => input.checked)!.value);
      }
    });
    if (kind === 'curator') {
      this.dispatch('change-curator', { detail: { 'curator-id': id ? +id : null } });
    }
    if (!id && kind !== 'curator') {
      Cookies.remove(`csp-${kind}-filter`);
    } else {
      Cookies.set(`csp-${kind}-filter`, id);
    }
  }
  
  onRenderStories(e: Event) {
    // const frame = e.target as FrameElement;
    imagesLoaded('#stories-gallery', (instance) => {
      this.galleryTarget.classList.remove('hidden');
      this.dispatch('ready', { detail: { resourceName: 'stories' } });
    })
    const showResults = (target: HTMLSpanElement) => {
      const results = this.cardTargets.length;
      target.textContent = `${results} ${results === 1 ? 'story' : 'stories'}`;
    }
    const turboFrameSrc = new URL(this.turboFrameTarget.src || '');
    // for (let key of searchParams.keys()) console.log(key)
    const searchString = turboFrameSrc.searchParams.get('q') || '';
    const filters = this.filterTypes.filter(type => turboFrameSrc.searchParams.has(type));
    if (searchString) {
      this.searchStringTarget.textContent = `"${searchString}"`;
      this.searchAndFiltersTarget.classList.remove('has-combined-results');
      showResults(this.searchResultsTarget);
      this.searchAndFiltersTarget.classList.add('has-search-results');
    } else if (filters.length > 1) {
      this.searchAndFiltersTarget.classList.remove('has-search-results');
      showResults(this.filterResultsTarget);
      this.searchAndFiltersTarget.classList.add('has-combined-results');
    } else {
      this.searchAndFiltersTarget.classList.remove('has-search-results', 'has-combined-results');
    }
  }

  filtersValueChanged(
    newVal: { 'curator-id': number | null },
    oldVal: { 'curator-id': number | null } | undefined
  ) {
    if (oldVal === undefined || JSON.stringify(newVal) === JSON.stringify(oldVal)) return;
    const curatorSelect = this.filterSelectTargets.find(select => (
      select.dataset.tomselectKindValue === 'curator'
    ));
    curatorSelect.tomselect.setValue(
      newVal['curator-id'] ? String(newVal['curator-id']) : '',
      !this.hasGalleryTarget
    );
    if (!this.hasGalleryTarget) {
      // The turbo frame src attribute will be a path only prior to the frame loading
      const newSrc = new URL(location.origin + this.turboFrameTarget.src);
      if (newVal['curator-id']) {
        newSrc.searchParams.set('curator', String(newVal['curator-id']));
      } else {
        newSrc.searchParams.delete('curator');
      }
      this.turboFrameTarget.src = newSrc.toString();
    }
  }
}