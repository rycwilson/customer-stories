import { Controller } from '@hotwired/stimulus';

export default class ListController extends Controller {
  static values = {
    sortEnabled: { type: Boolean, default: true },
    collapseEnabled: { type: Boolean, default: false },
    newItemFieldName: { type: String, default: '' },
  }
  declare readonly sortEnabledValue: boolean;
  declare readonly collapseEnabledValue: boolean;
  declare readonly newItemFieldNameValue: string;

  static targets = [
    'newItem',
    'newItemInput',
    'newItemSubmit',
    'list',
    'item',
    'sortHandle',
    'itemInput',
    '_destroyCheckbox',
    'cancelButton',
    'collapse',
  ];
  declare readonly newItemTarget: HTMLDivElement;
  declare readonly newItemInputTarget: HTMLInputElement;
  declare readonly newItemSubmitTarget: HTMLButtonElement;
  declare readonly listTarget: HTMLUListElement | HTMLOListElement;
  declare readonly itemTargets: HTMLLIElement[];
  declare readonly sortHandleTargets: HTMLElement[];
  declare readonly itemInputTargets: HTMLInputElement[];
  declare readonly cancelButtonTargets: HTMLButtonElement[];
  declare readonly _destroyCheckboxTargets: HTMLInputElement[];
  declare readonly collapseTargets: HTMLDivElement[];

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

  onClickSubmit(e: PointerEvent) {
    e.preventDefault();
    const button = <HTMLButtonElement>e.target;
    const isNewItem = this.newItemTarget.contains(button);
    let cancelButton: HTMLButtonElement | null = null;
    if (isNewItem) {
      // this.listTarget.classList.add('list-group--has-active');
      cancelButton = <HTMLButtonElement>this.cancelButtonTargets.find(button => (
        this.newItemTarget.contains(button)
      ));
    } else if (this.itemElements(button)) {
      const sortHandle = this.itemElements(button)!.sortHandle;
      sortHandle?.classList.add('list-group-item__handle--disabled');
      cancelButton = this.itemElements(button)!.cancelButton;
    } else {
      // handle collapse events
    }
    if (cancelButton) {
      cancelButton.disabled = true;
      $(cancelButton).tooltip('destroy');
    }
    this.dispatch('ready-to-submit', { detail: { submitter: button } });
  }
  
  onShownCollapse(e: CustomEvent) {
    const collapse = <HTMLElement>e.target;
    const item = <HTMLLIElement>collapse.parentElement;
    collapse.scrollIntoView({ block: 'center' });
    this.collapseTargets.filter(div => div !== collapse).forEach(div => $(div).collapse('hide'));

    // Add a class name for managing css transitions
    item.classList.remove('list-group-item--collapsed');
  }
  
  onHiddenCollapse(e: CustomEvent) {
    const collapse = <HTMLElement>e.target;
    const item = <HTMLLIElement>collapse.parentElement;
    this.dispatch('hidden-collapse', { detail: { item, collapse } });

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

    $(this.listTarget).sortable(options);
    
    // When dragging, cancel any ongoing edits. Avoids complexity of managing ui for multiple changes 
    $(this.listTarget).find('.list-group-item__handle').each((i: number, handle: HTMLElement) => {
      $(handle).mousedown(() => {
        const item = <HTMLLIElement>this.itemTargets.find(item => item.contains(handle));
        const cancelButton = <HTMLButtonElement>this.cancelButtonTargets.find(button => item.contains(button));
        cancelButton.click();
      });
    });
  }

  onInputNewItem({ target: input }: { target: HTMLInputElement }) {
    // const min = input.minLength;
    // const max = input.maxLength;
    // if (isNaN(min) || isNaN(max)) return;
    
    const len = input.value.trim().length;
    // const isValid = len >= min && len <= max;
    this.toggleNewItem(len > 0);
  }

  toggleNewItem(shouldEnable: boolean) {
    const cancelButtonAddon = <HTMLElement>this.newItemInputTarget.nextElementSibling;
    cancelButtonAddon.classList.toggle('hidden', !shouldEnable);
    this.newItemInputTarget.name = shouldEnable ? this.newItemFieldNameValue : '';
    if (!shouldEnable) this.newItemInputTarget.value = '';
    this.newItemSubmitTarget.classList.toggle('hidden', !shouldEnable);

    // this.dispatch('toggle-new-item', { detail: { isActive: shouldEnable } });
    
    // The new result isn't strictly part of the list, but we want to disable click events 
    // in the list while the new result field has a value and this effectively does so.
    // TODO: In the case of Results, it's a single field on Story, and we want to prevent concurrent edits.
    // Between disabling controls and losing data, it may be better to allow the user to enable
    // whichever field they want to edit, but at risk of losing data in the other field.
    // this.listTarget.classList.toggle('list-group--has-active', shouldEnable);
  }
  
  cancelNewItem() {
    this.toggleNewItem(false);
  }
  
  editItem({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const { item, input } = this.itemElements(button)!;
    const sortHandle = this.isSortable ?
      (<HTMLElement>this.sortHandleTargets.find(handle => item.contains(handle)) ?? null) :
      null;
    const cancelButton = <HTMLButtonElement>this.cancelButtonTargets.find(button => item.contains(button));
    // this.listTarget.classList.add('list-group--has-active');
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
    const { item, input } = this.itemElements(button)!;
    item.classList.remove('list-group-item--active');   
    this.element.classList.remove('list-group--has-active');
    this.dispatch('toggle-edit', { detail: { item, isEditable: false } });
    setTimeout(() => input.value = input.dataset.initialValue || '');
  }

  deleteItem({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const { item } = this.itemElements(button)!;
    const _destroyCheckbox = this._destroyCheckboxTargets.find(checkbox => item.contains(checkbox))
    this.listTarget.classList.add('list-group--has-active');
    if (confirm('Delete this item? This action cannot be undone.')) {
      button.blur();
      if (_destroyCheckbox) _destroyCheckbox.checked = true;
      item.classList.add('list-group-item--deleting');
      this.dispatch('ready-to-submit');
    } else {
      button.blur();
      this.listTarget.classList.remove('list-group--has-active');
    }
  }

  itemElements(childButton: HTMLButtonElement) {
    const item = this.itemTargets.find(item => item.contains(childButton));
    if (!item) return null;

    const input = <HTMLInputElement>this.itemInputTargets.find(input => item.contains(input));
    const sortHandle = this.isSortable ?
      <HTMLElement>this.sortHandleTargets.find(handle => item.contains(handle)) :
      null;
    const cancelButton = <HTMLButtonElement>this.cancelButtonTargets.find(button => item.contains(button));
    return { item, input, sortHandle, cancelButton };
  }
}