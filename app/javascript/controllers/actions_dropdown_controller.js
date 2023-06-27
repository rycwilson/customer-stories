import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.parentRow = this.element.closest('tr');
    this.dropdownMenu = this.element.querySelector('.dropdown-menu');
    $(this.element).on('shown.bs.dropdown', this.onShown.bind(this));
    $(this.element).on('hidden.bs.dropdown', this.onHidden.bind(this));
  }
  
  onShown() {
    const windowBottom = window.scrollY + window.innerHeight;
    const dropdownBottom = $(this.dropdownMenu).offset().top + $(this.dropdownMenu).outerHeight();
    this.parentRow.classList.add('active');
    if (dropdownBottom > windowBottom) this.dropdownMenu.classList.add('flip', 'shown')
    else this.dropdownMenu.classList.add('shown');
  }

  onHidden() {
    this.dropdownMenu.classList.remove('flip', 'shown');
    
    // don't remove .active if the child row is open
    if (!this.parentRow.classList.contains('shown')) this.parentRow.classList.remove('active');
  }
}