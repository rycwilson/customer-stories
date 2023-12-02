import { Controller } from '@hotwired/stimulus';
import { type FrameElement } from '@hotwired/turbo';
import Cookies from 'js-cookie';
import imagesLoaded from 'imagesloaded';
import { capitalize } from '../utils';

export default class extends Controller<HTMLDivElement> {
  static targets = [
    'turboFrame',
    'gallery', 
    'card', 
    'searchAndFilters',   // one container for xs and sm, another for md and lg
    'filterMatchTypeRadio',
    'filterSelect', 
    'curatorSelect',
    'statusSelect', 
    'customerSelect',
    'categorySelect',
    'productSelect'
  ];
  declare readonly turboFrameTarget: FrameElement;
  declare readonly galleryTarget: HTMLUListElement;
  declare readonly cardTargets: HTMLDivElement[];
  declare readonly searchAndFiltersTargets: HTMLDivElement[];
  declare readonly filterMatchTypeRadioTargets: HTMLInputElement[];
  declare readonly filterSelectTargets: HTMLSelectElement[];
  declare readonly curatorSelectTarget: HTMLSelectElement;
  declare readonly statusSelectTarget: HTMLSelectElement;
  declare readonly customerSelectTarget: HTMLSelectElement;
  declare readonly categorySelectTarget: HTMLSelectElement;
  declare readonly productSelectTarget: HTMLSelectElement;

  static values = { filterMatchType: String };
  declare filterMatchTypeValue: string;
  
  readyFilters = 0;

  connect() {
    // console.log('connect stories')
    this.filterMatchTypeRadioTargets.forEach(input => {
      input.checked = input.value === this.filterMatchTypeValue;
    })

    // document.documentElement.addEventListener('turbo:frame-render', this.onGalleryRender.bind(this));
    this.turboFrameTarget.addEventListener('turbo:frame-render', this.onRenderGallery.bind(this));
  }

  disconnect() {
    // no need for this since listener is attached to the frame (which will disappear along with its listeners when this disconnects)
    // document.documentElement.removeEventListener('turbo:frame-render', this.onGalleryRender.bind(this));
  }

  onInitFilter(e: Event) {
    if (++this.readyFilters === this.filterSelectTargets.length) {
      this.searchAndFiltersTargets.forEach(container => container.setAttribute('data-init', 'true'));
    }
  }

  clearFilters() {
    this.filterSelectTargets.forEach(select => select.tomselect.clear(true));
    if (this.turboFrameTarget.src) {
      const newSrc = new URL(this.turboFrameTarget.src);
      ['curator', 'status', 'customer', 'category', 'product'].forEach(param => {
        newSrc.searchParams.delete(param);
        param === 'curator' ? Cookies.set('csp-curator-filter', '') : Cookies.remove(`csp-${param}-filter`);
      });
      this.fetchGallery(newSrc);
    }
  }

  onFilterMatchTypeChange({ target: input }: { target: EventTarget }) {
    if (!(input instanceof HTMLInputElement)) return;
    this.filterMatchTypeValue = input.value;
  }

  filterMatchTypeValueChanged(newVal: string, oldVal: string) {
    if (!oldVal) return;
    if (this.turboFrameTarget.src) {
      this.fetchGallery(new URL(this.turboFrameTarget.src))
    }
    Cookies.set('csp-filters-match-type', newVal);
  }

  onChangeFilter(e: CustomEvent) {
    const { type, id } = e.detail;
    if (this.turboFrameTarget.src) {
      const newSrc = new URL(this.turboFrameTarget.src);
      if (id) {
        newSrc.searchParams.set(type, id);
      } else {
        newSrc.searchParams.delete(type);
      }
      this.fetchGallery(newSrc);
    }
    if (!id && type !== 'curator') {
      Cookies.remove(`csp-${type}-filter`);
    } else {
      Cookies.set(`csp-${type}-filter`, id);
    }
  }

  fetchGallery(newSrc: URL) {
    console.log('fetching', newSrc.toString())
    newSrc.searchParams.set('match_type', this.filterMatchTypeValue);
    this.turboFrameTarget.src = newSrc.toString();
  }

  onRenderGallery(e: Event) {
    console.log(e)
    const frame = e.target as FrameElement;

    // if (frame.id !== 'stories') return;
    imagesLoaded('#stories-gallery', (instance) => {
      // console.log('images loaded', instance)
      this.galleryTarget.classList.remove('hidden');
    })
  }
}