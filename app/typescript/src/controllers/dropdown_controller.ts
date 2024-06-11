import { Controller } from "@hotwired/stimulus";

export default class DropdownController extends Controller<HTMLTableCellElement> {
  static targets = ['dropdownMenu'];
  declare readonly dropdownMenuTarget: HTMLUListElement;

  shownHandler = this.onShown.bind(this);
  hiddenHandler = this.onHidden.bind(this);

  connect() {
    $(this.element).on('shown.bs.dropdown', this.shownHandler);
    $(this.element).on('hidden.bs.dropdown', this.hiddenHandler);
  }

  disconnect() {
    $(this.element).off('shown.bs.dropdown', this.shownHandler);
    $(this.element).off('hidden.bs.dropdown', this.hiddenHandler);
  }
  
  onShown() {
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

  onHidden() {
    this.dropdownMenuTarget.classList.remove('flip', 'shown');
    this.dispatch('dropdown-is-hidden');
  }
}