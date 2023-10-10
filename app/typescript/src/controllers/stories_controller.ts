import { Controller } from '@hotwired/stimulus';
import imagesLoaded from 'imagesloaded';

export default class extends Controller<HTMLDivElement> {
  static targets = ['searchAndFilters', 'filterSelect', 'gallery', 'card'];
  declare readonly searchAndFiltersTargets: HTMLDivElement[];
  declare readonly filterSelectTargets: HTMLSelectElement[];
  declare readonly galleryTarget: HTMLDivElement;
  declare readonly cardTargets: HTMLDivElement[];
  
  readyFilters = 0;

  connect() {
    // console.log('connect stories')
    imagesLoaded('#stories-gallery', (instance) => {
      // console.log('images loaded', e)
      this.galleryTarget.classList.remove('hidden');
    })
  }

  onInitFilter(e: Event) {
    if (++this.readyFilters === this.filterSelectTargets.length) 
      this.searchAndFiltersTargets.forEach(container => container.setAttribute('data-init', 'true'));
  }
}