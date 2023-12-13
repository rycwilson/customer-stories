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
    'filterResultsContainer',
    'filterResults',
    'filterSelect', 
  ];
  declare readonly turboFrameTarget: FrameElement;
  declare readonly galleryTarget: HTMLUListElement;
  declare readonly cardTargets: HTMLDivElement[];
  declare readonly searchAndFiltersTarget: HTMLDivElement;
  declare readonly searchInputTarget: HTMLInputElement;
  declare readonly filterResultsContainerTarget: HTMLDivElement;
  declare readonly filterResultsTarget: HTMLSpanElement;
  declare readonly filterSelectTargets: HTMLSelectElement[];
  
  readyFilters = 0;

  connect() {
    // console.log('connect stories')
    
    // document.documentElement.addEventListener('turbo:frame-render', this.onGalleryRender.bind(this));
    this.turboFrameTarget.addEventListener('turbo:frame-render', this.onRenderGallery.bind(this));
  }
  
  disconnect() {
    // no need for this since listener is attached to the frame (which will disappear along with its listeners when this disconnects)
    // document.documentElement.removeEventListener('turbo:frame-render', this.onGalleryRender.bind(this));
  }
  
  get activeFilters() {
    return this.filterSelectTargets.filter(select => select.value);
  }
  
  get filterTypes() {
    return this.filterSelectTargets.map(select => select.dataset.tomselectTypeValue);
  }
  
  // TODO: before intial load, make sure all images on the page (namely the search icon) are loaded
  fetchGallery(updateParams: ((src: URL) => void) | undefined = undefined) {
    if (this.turboFrameTarget.src) {
      const newSrc = new URL(this.turboFrameTarget.src);
      if (updateParams) updateParams(newSrc);
      console.log('fetching', newSrc.toString())
      this.turboFrameTarget.src = newSrc.toString();
    }
  }

  clearSearch() {
    this.searchInputTarget.value = '';
  }

  clearFilters(e: CustomEvent | undefined = undefined) {
    const isUserInput = Boolean(e);
    if (this.activeFilters.length === 0) return;
    this.filterSelectTargets.forEach(select => select.tomselect.clear(true));
    this.filterResultsContainerTarget.classList.add('hidden');
    if (isUserInput) {
      this.fetchGallery((turboFrameSrc: URL) => {
        this.filterTypes.forEach(param => turboFrameSrc.searchParams.delete(param || ''));
      })
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
    this.fetchGallery((turboFrameSrc: URL) => {
      turboFrameSrc.searchParams.set('match_type', input.value);
    });
    Cookies.set('csp-filters-match-type', input.value);
  }

  onSubmitSearch(e: Event) {
    e.preventDefault()
    this.clearFilters();
    this.fetchGallery((turboFrameSrc: URL) => {
      for (const [param, value] of turboFrameSrc.searchParams.entries()) {
        turboFrameSrc.searchParams.delete(param);
      }
      turboFrameSrc.searchParams.set('q', this.searchInputTarget.value.trim());
    });
  }

  onChangeFilter(e: CustomEvent) {
    const { type, id } = e.detail;
    this.clearSearch();
    this.fetchGallery((turboFrameSrc: URL) => {
      if (id) {
        turboFrameSrc.searchParams.set(type, id);
        turboFrameSrc.searchParams.delete('q');
      } else {
        turboFrameSrc.searchParams.delete(type);
      }
    });
    if (!id && type !== 'curator') {
      Cookies.remove(`csp-${type}-filter`);
    } else {
      Cookies.set(`csp-${type}-filter`, id);
    }
  }
  
  onRenderGallery(e: Event) {
    const frame = e.target as FrameElement;
    imagesLoaded('#stories-gallery', (instance) => this.galleryTarget.classList.remove('hidden'));
    const results = this.cardTargets.length;
    if (this.activeFilters.length > 1) {
      this.searchAndFiltersTarget.classList.add('has-combined-results');
      this.filterResultsTarget.textContent = `${results} ${results === 1 ? 'story' : 'stories'} found`
    } else {
      this.searchAndFiltersTarget.classList.remove('has-combined-results');
    }
  }
}