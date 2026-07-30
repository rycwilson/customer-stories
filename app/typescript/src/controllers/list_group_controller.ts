import { Controller } from '@hotwired/stimulus';
import { handleDisabledElement } from '@rails/ujs';
// import 

export default class ListGroupController extends Controller<HTMLUListElement | HTMLOListElement> {
  static values = {
    sortEnabled: { type: Boolean, default: true },
    collapseEnabled: { type: Boolean, default: false }
  }
  declare readonly sortEnabledValue: boolean;
  declare readonly collapseEnabledValue: boolean;

  static targets = ['item', 'itemText', 'itemInput', 'undoButton', 'collapse'];
  declare readonly itemTargets: HTMLLIElement[];
  declare itemTextTargets: HTMLParagraphElement[];
  declare readonly itemInputTargets: HTMLInputElement[];
  declare undoButtonTargets: HTMLButtonElement[];
  declare collapseTargets: HTMLDivElement[];

  get isSortable() {
    return this.sortEnabledValue && $(this.element).data('uiSortable');
  }

  get hasCollapsible() {
    return this.collapseTargets.length > 0;
  }

  connect() {
    if (this.sortEnabledValue) this.initSortable();
    if (this.collapseEnabledValue) this.initCollapsible();
  }

  disconnect() {
    if (this.isSortable) $(this.element).sortable('destroy');
  }

  initCollapsible() {
    this.collapseTargets.forEach(collapsible => {
      $(collapsible).on('shown.bs.collapse hidden.bs.collapse', (e: Event) => {
        if (e.type === 'shown') {
          // Add a class name for managing css transitions
          collapsible.parentElement?.classList.add('list-group-item--expanded');
          collapsible.scrollIntoView({ block: 'center' });
          collapsible.querySelector<HTMLInputElement>('[name*="display_text"]')?.focus();
        } else {
          // Delayed class name removal prevents a style transistion that would otherwise occur
          setTimeout(() => {
            collapsible.parentElement?.classList.remove('list-group-item--expanded');
          }, 200);
        }
      });
    });
  }

  initSortable() {
    if (this.itemTargets.length < 2) return;

    const options = {
      items: '.list-group-item',
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
        ui.item.addClass('dragging');
        $(ui.item).data('previndex', ui.item.index());
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
        setTimeout(() => ui.item.removeClass('dragging'), 200);
      }
    }
    $(this.element).sortable(options);
  }
  
  onItemInput({ target: input }: { target: HTMLInputElement }) {
    // const item = <HTMLAnchorElement>this.itemTargets.find(item => item.contains(input));
    // const undoButton = <HTMLButtonElement>this.undoButtonTargets.find(button => item.contains(button));
    // item.classList.toggle('will-be-updated', input.value !== input.dataset.initialValue);
    // undoButton.setAttribute('data-tooltip-options-value', JSON.stringify({ title: 'Undo Changes' }));
  }

  editItem({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const item = <HTMLLIElement>this.itemTargets.find(item => item.contains(button));
    item.classList.add('will-be-updated');
  }

  deleteItem({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    // const item = <HTMLAnchorElement>this.itemTargets.find(item => item.contains(button));
    // const itemText = <HTMLParagraphElement>this.itemTextTargets.find(p => item.contains(p));
    // const undoButton = <HTMLButtonElement>this.undoButtonTargets.find(button => item.contains(button));
    // item.classList.add('will-be-removed');
    // itemText.innerHTML = `<s>${itemText.textContent}</s>`;
    // undoButton.setAttribute('data-tooltip-options-value', JSON.stringify({ title: 'Undo Delete' }));
    // $(this.element).sortable('destroy')
    // $(this.element).sortable({ items: '.list-group-item:not(.will-be-removed)' });
  }

  undo({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
  //   const item = <HTMLAnchorElement>this.itemTargets.find(item => item.contains(button));
  //   if (item.classList.contains('will-be-removed')) {
  //     const itemText = <HTMLParagraphElement>this.itemTextTargets.find(p => item.contains(p));
  //     itemText.innerHTML = itemText.innerText;
  //   } else {
  //     const itemInput = <HTMLInputElement>this.itemInputTargets.find(input => item.contains(input));
  //     itemInput.value = <string>itemInput.dataset.initialValue;
  //   }
  //   item.classList.remove('will-be-updated', 'will-be-removed');
  //   $(this.element).sortable('destroy')
  //   $(this.element).sortable({ items: '.list-group-item:not(.will-be-removed)' });
  }
}