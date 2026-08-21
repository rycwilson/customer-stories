import { Controller } from '@hotwired/stimulus';

export default class ListController extends Controller {
  static values = {
    sortEnabled: { type: Boolean, default: true },
    collapseEnabled: { type: Boolean, default: false }
  }
  declare readonly sortEnabledValue: boolean;
  declare readonly collapseEnabledValue: boolean;

  static targets = ['newItemInput', 'newItemSubmit', 'list', 'item', 'itemInput', 'cancelButton', 'collapse', 'sortHandle'];
  declare readonly newItemInputTarget: HTMLInputElement;
  declare readonly newItemSubmitTarget: HTMLButtonElement;
  declare readonly listTarget: HTMLUListElement | HTMLOListElement;
  declare readonly itemTargets: HTMLLIElement[];
  declare readonly itemInputTargets: HTMLInputElement[];
  declare readonly cancelButtonTargets: HTMLButtonElement[];
  declare readonly collapseTargets: HTMLDivElement[];
  declare readonly sortHandleTargets: HTMLElement[];

  shownCollapseHandler = this.onShownCollapse.bind(this);
  hiddenCollapseHandler = this.onHiddenCollapse.bind(this);

  get isSortable() {
    return $(this.listTarget).data('uiSortable');
  }

  disconnect() {
    if (this.isSortable) $(this.listTarget).sortable('destroy');
  }

  sortEnabledValueChanged(shouldEnable: boolean) {
    if (shouldEnable) {
      this.initSortable();
    } else if (this.isSortable) {
      $(this.listTarget).sortable('destroy');
    }
  }

  collapseEnabledValueChanged(shouldEnable: boolean) {
    if (shouldEnable) this.initCollapsible();
  }

  initCollapsible() {
    this.collapseTargets.forEach(div => {
      $(div).on('shown.bs.collapse', this.shownCollapseHandler);
      $(div).on('hidden.bs.collapse', this.hiddenCollapseHandler);
    });
  }
  
  onShownCollapse(e: CustomEvent) {
    const collapse = <HTMLElement>e.target;
    const item = <HTMLLIElement>collapse.parentElement;
    collapse.scrollIntoView({ block: 'center' });

    // Add a class name for managing css transitions
    item.classList.remove('list-group-item--collapsed');
  }
  
  onHiddenCollapse(e: CustomEvent) {
    const collapse = <HTMLElement>e.target;
    const item = <HTMLLIElement>collapse.parentElement;

    // Delayed class name removal prevents a style transistion that would otherwise occur
    setTimeout(() => {
      item.classList.add('list-group-item--collapsed');
    }, 200);
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
    
    // When dragging, cancel any ongoing edits. Avoids complexity of managing ui for multiple changes 
    $(this.element).find('.list-group-item__handle').each((i: number, handle: HTMLElement) => {
      $(handle).mousedown(() => {
        const item = <HTMLLIElement>this.itemTargets.find(item => item.contains(handle));
        const cancelButton = <HTMLButtonElement>this.cancelButtonTargets.find(button => item.contains(button));
        cancelButton.click();
      });
    });
  }

  onNewItemInput({ target: input }: { target: HTMLInputElement }) {
    // const min = input.minLength;
    // const max = input.maxLength;
    // if (isNaN(min) || isNaN(max)) return;
    
    const len = input.value.trim().length;
    // const isValid = len >= min && len <= max;
    this.toggleNewItem(len > 0);
  }

  
  toggleNewItem(shouldEnable: boolean) {
    const cancelButton = <HTMLElement>this.newItemInputTarget.nextElementSibling;
    cancelButton.classList.toggle('hidden', !shouldEnable);
    this.newItemSubmitTarget.classList.toggle('hidden', !shouldEnable);
    this.newItemInputTarget.name = shouldEnable ? 'story[new_results][]' : '';
    
    // The new result isn't strictly part of the list, but we want to disable click events 
    // in the list while the new result field has a value and this effectively does so.
    this.listTarget.classList.toggle('list-group--has-active', shouldEnable);
  }
  
  cancelNewItem() {
    this.newItemInputTarget.value = '';
    this.newItemInputTarget.dispatchEvent(new Event('input', { bubbles: true }));
    // this.newItemInputTarget.focus();
  }
  
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
      this.dispatch('delete', { detail: { item, input } });
    } else {
      button.blur();
      this.element.classList.remove('list-group--has-active');
    }
  }
}