import { Controller } from '@hotwired/stimulus';
import imagesLoaded from 'imagesloaded';

export default class extends Controller<HTMLDivElement> {
  static targets = [
    'searchAndFilters',   // one container for xs and sm, another for md and lg
    'filterSelect', 
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
  declare readonly galleryTarget: HTMLDivElement;
  declare readonly cardTargets: HTMLDivElement[];
  declare readonly curatorSelectTarget: HTMLSelectElement;
  declare readonly statusSelectTarget: HTMLSelectElement;
  declare readonly customerSelectTarget: HTMLSelectElement;
  declare readonly categorySelectTarget: HTMLSelectElement;
  declare readonly productSelectTarget: HTMLSelectElement;
  
  readyFilters = 0;

  connect() {
    // console.log('connect stories')
    imagesLoaded('#stories-gallery', (instance) => {
      // console.log('images loaded', e)
      this.galleryTarget.classList.remove('hidden');
    })

    console.log('filterSelect: ', this.filterSelectTargets)
  }

  onInitFilter(e: Event) {
    if (++this.readyFilters === this.filterSelectTargets.length) {
      this.searchAndFiltersTargets.forEach(container => container.setAttribute('data-init', 'true'));
    }
  }
}