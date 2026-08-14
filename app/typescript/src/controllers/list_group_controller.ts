import { Controller } from '@hotwired/stimulus';

export default class ListGroupController extends Controller<HTMLUListElement | HTMLOListElement> {
  static values = {
    sortEnabled: { type: Boolean, default: true },
    collapseEnabled: { type: Boolean, default: false }
  }
  declare readonly sortEnabledValue: boolean;
  declare readonly collapseEnabledValue: boolean;

  static targets = ['newItemSubmit', 'item', 'itemInput', 'cancelButton', 'collapse', 'sortHandle'];
  declare readonly newItemSubmitTarget: HTMLButtonElement;
  declare readonly itemTargets: HTMLLIElement[];
  declare readonly itemInputTargets: HTMLInputElement[];
  declare readonly cancelButtonTargets: HTMLButtonElement[];
  declare readonly collapseTargets: HTMLDivElement[];
  declare readonly sortHandleTargets: HTMLElement[];

  get isSortable() {
    return this.sortEnabledValue && $(this.element).data('uiSortable');
  }

  connect() {
    // this.toggleSortable(this.sortEnabledValue);
    if (this.sortEnabledValue) this.initSortable();
    if (this.collapseEnabledValue) this.initCollapsible();
  }

  disconnect() {
    if (this.isSortable) $(this.element).sortable('destroy');
  }

  initCollapsible() {
    this.collapseTargets.forEach(div => {
      $(div).on('shown.bs.collapse hidden.bs.collapse', function (this: HTMLDivElement, e: Event) {
        if (e.type === 'shown') {
          // Add a class name for managing css transitions
          this.parentElement?.classList.add('list-group-item--expanded');
          this.scrollIntoView({ block: 'center' });
          // const input = this.querySelectorAll<HTMLInputElement>('input[type="text"]')[0];
          // input?.focus();
          // input?.setSelectionRange(input.value.length, input.value.length);
        } else {
          // Delayed class name removal prevents a style transistion that would otherwise occur
          setTimeout(() => {
            this.parentElement?.classList.remove('list-group-item--expanded');
          }, 200);
        }
      });
    });
  }

  initSortable() {
    if (this.itemTargets.length < 2) return;

    const options = {
      items: '.list-group-item',
      handle: '.list-group-item__handle',
      // classes: {
      //   'ui-sortable-helper': 'ui-sortable-helper',
      //   'ui-sortable-placeholder': 'ui-sortable-placeholder',
      // },
      helper: (e: Event, item: JQuery<HTMLAnchorElement, any>) => (
        item.clone().css('width', item.css('width')).find('button').remove().end()
      ),
      start: (_e: Event, ui: JQueryUI.SortableUIParams) => {
        // The ui.item (.ui-sortable-handle) will be hidden while it's being dragged.
        // Add a class name for managing css transitions (see `stop` callback below)

        // ui.item.find('[data-action="list-group#cancelEdit"]').trigger('click')

        ui.item.addClass('ui-sortable-handle--dragging');
        ui.item.data('previndex', ui.item.index());
      },
      update: (_e: Event, ui: JQueryUI.SortableUIParams) => {
        const newIndex = ui.item.index();
        const oldIndex = $(ui.item).data('previndex');

        this.dispatch('sorted', { detail: { item: ui.item, oldIndex, newIndex } });
        $(ui.item).removeData('previndex');
      },
      change: (_e: Event, _ui: JQueryUI.SortableUIParams) => {
      },
      stop: (_e: Event, ui: JQueryUI.SortableUIParams) => {
        // Delayed class name removal prevents a style transistion that would otherwise occur
        setTimeout(() => ui.item.removeClass('ui-sortable-handle--dragging'), 200);
      }
    }

    $(this.element).sortable(options);
    
    $(this.element).find('.list-group-item__handle').each((i: number, handle: HTMLElement) => {
      $(handle).mousedown(() => {
        const item = <HTMLLIElement>this.itemTargets.find(item => item.contains(handle));
        const cancelButton = <HTMLButtonElement>this.cancelButtonTargets.find(button => item.contains(button));
        cancelButton.click();
      });
    });
  }

  // onItemInput({ target: input }: { target: HTMLInputElement }) {
  // }
  
  editItem({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const item = <HTMLLIElement>this.itemTargets.find(item => item.contains(button));
    const input = <HTMLInputElement>this.itemInputTargets.find(input => item.contains(input));
    const sortHandle = this.isSortable ?
      (<HTMLElement>this.sortHandleTargets.find(handle => item.contains(handle)) ?? null) :
      null;
    const cancelButton = <HTMLButtonElement>this.cancelButtonTargets.find(button => item.contains(button));
    this.element.classList.add('list-group--has-active');
    item.classList.add('list-group-item--active');
    this.dispatch(
      'toggle-edit', 
      { detail: { item, isEditable: true, cancelButton, ...(sortHandle ? { sortHandle } : {}) } }
    );

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  }
  
  cancelEdit({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const item = <HTMLLIElement>this.itemTargets.find(item => item.contains(button));
    const input = <HTMLInputElement>this.itemInputTargets.find(input => item.contains(input));
    item.classList.remove('list-group-item--active');   
    this.element.classList.remove('list-group--has-active');
    this.dispatch('toggle-edit', { detail: { item, isEditable: false } });
    setTimeout(() => input.value = input.dataset.initialValue || '');
  }

  deleteItem({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const item = <HTMLLIElement>this.itemTargets.find(item => item.contains(button));
    const input = <HTMLInputElement>this.itemInputTargets.find(input => item.contains(input));
    this.element.classList.add('list-group--has-active');
    if (confirm('Delete this item? This action cannot be undone.')) {
      button.blur();
      item.classList.add('list-group-item--deleting');
      this.dispatch('delete', { detail: { input } });
    } else {
      button.blur();
      this.element.classList.remove('list-group--has-active');
    }
  }
}