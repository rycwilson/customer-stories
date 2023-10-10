import { Controller } from "@hotwired/stimulus";

export default class extends Controller<HTMLTableCellElement> {
  parentRow: HTMLTableRowElement | undefined = undefined;
  dropdownMenu: HTMLUListElement | undefined = undefined;

  connect() {
    this.parentRow = this.element.closest('tr') || undefined;
    this.dropdownMenu = this.element.querySelector('.dropdown-menu') as HTMLUListElement|| undefined;
    $(this.element).on('shown.bs.dropdown', this.onShown.bind(this));
    $(this.element).on('hidden.bs.dropdown', this.onHidden.bind(this));
  }
  
  onShown() {
    if (this.parentRow === undefined || this.dropdownMenu === undefined) return;
    const windowBottom = window.scrollY + window.innerHeight;
    // const dropdownBottom = $(this.dropdownMenu).offset().top + $(this.dropdownMenu).outerHeight();
    const dropdownBottom = (scrollY + this.dropdownMenu.getBoundingClientRect().top) + this.dropdownMenu.clientHeight;
    this.parentRow.classList.add('active');
    if (dropdownBottom > windowBottom) this.dropdownMenu.classList.add('flip', 'shown')
    else this.dropdownMenu.classList.add('shown');
  }

  onHidden() {
    if (this.parentRow === undefined || this.dropdownMenu === undefined) return;
    this.dropdownMenu.classList.remove('flip', 'shown');
    
    // don't remove .active if the child row is open
    if (!this.parentRow.classList.contains('shown')) this.parentRow.classList.remove('active');
  }
}