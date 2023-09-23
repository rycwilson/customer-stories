import { Controller } from '@hotwired/stimulus';
import imagesLoaded from 'imagesloaded/imagesloaded.pkgd';

export default class extends Controller {
  static targets = ['searchAndFilters', 'filterSelect', 'gallery', 'card'];

  readyFilters = 0;

  connect() {
    // console.log('connect stories')
    imagesLoaded('#stories-gallery', (e) => {
      // console.log('images loaded', e)
      this.galleryTarget.classList.remove('hidden');
    })
  }

  onInitFilter(e) {
    if (++this.readyFilters === this.filterSelectTargets.length) 
      this.searchAndFiltersTargets.forEach(container => container.setAttribute('data-init', 'true'));
  }
}