import { Controller } from "@hotwired/stimulus";

export default class DropdownController extends Controller<HTMLTableCellElement> {
  static targets = ['dropdownMenu'];
  declare readonly dropdownMenuTarget: HTMLUListElement;

  onShown = this.handleShown.bind(this);
  onHidden = this.handleHidden.bind(this);

  connect() {
    $(this.element).on('shown.bs.dropdown', this.onShown);
    $(this.element).on('hidden.bs.dropdown', this.onHidden);
  }

  disconnect() {
    $(this.element).off('shown.bs.dropdown', this.onShown);
    $(this.element).off('hidden.bs.dropdown', this.onHidden);
  }
  
  handleShown() {
    const windowBottom = window.scrollY + window.innerHeight;
    // const dropdownBottom = $(this.dropdownMenu).offset().top + $(this.dropdownMenu).outerHeight();
    const dropdownBottom = (
      scrollY + 
      this.dropdownMenuTarget.getBoundingClientRect().top + 
      this.dropdownMenuTarget.clientHeight
    );
    if (dropdownBottom > windowBottom) {
      this.dropdownMenuTarget.classList.add('flip');
    }
    this.dropdownMenuTarget.classList.add('shown');
    this.dispatch('dropdown-is-shown');
  }

  handleHidden() {
    this.dropdownMenuTarget.classList.remove('flip', 'shown');
    this.dispatch('dropdown-is-hidden');
  }
}