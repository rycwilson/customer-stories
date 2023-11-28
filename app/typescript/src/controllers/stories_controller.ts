import { Controller } from '@hotwired/stimulus';
import { type FrameElement } from '@hotwired/turbo';
import imagesLoaded from 'imagesloaded';

export default class extends Controller<HTMLDivElement> {
  static targets = [
    'searchAndFilters',   // one container for xs and sm, another for md and lg
    'filterSelect', 
    'filterMatchTypeRadio',
    'gallery', 
    'card', 
    'curatorSelect', 
    'statusSelect', 
    'customerSelect',
    'categorySelect',
    'productSelect'
  ];
  declare readonly searchAndFiltersTargets: HTMLDivElement[];
  declare readonly filterSelectTargets: HTMLSelectElement[];
  declare readonly filterMatchTypeRadioTargets: HTMLInputElement[];
  declare readonly galleryTarget: HTMLDivElement;
  declare readonly cardTargets: HTMLDivElement[];
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
    imagesLoaded('#stories-gallery', (instance) => {
      // console.log('images loaded', e)
      this.galleryTarget.classList.remove('hidden');
    })

    this.filterMatchTypeRadioTargets.forEach(input => {
      input.checked = input.value === this.filterMatchTypeValue;
    })
  }

  onInitFilter(e: Event) {
    if (++this.readyFilters === this.filterSelectTargets.length) {
      this.searchAndFiltersTargets.forEach(container => container.setAttribute('data-init', 'true'));
    }
  }

  clearAllFilters() {
    this.filterSelectTargets.forEach(select => select.tomselect.clear(true));
  }

  onFilterMatchTypeChange({ target: input }: { target: EventTarget }) {
    if (!(input instanceof HTMLInputElement)) return;
    this.filterMatchTypeValue = input.value;
  }

  filterMatchTypeValueChanged(matchType: string) {
    console.log('matchType', matchType)
  }

  onFilterChange(e: CustomEvent) {
    const { type, id } = e.detail;
    const turboFrame = this.element.parentElement as FrameElement;
    console.log(type, id)
    if (turboFrame.src) {
      const newSrc = new URL(turboFrame.src);
      newSrc.searchParams.set(type, id)
      turboFrame.src = newSrc.toString();
    }
  }
}