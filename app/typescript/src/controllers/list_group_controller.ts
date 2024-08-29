import { Controller } from '@hotwired/stimulus';

export default class ListGroupController extends Controller<HTMLUListElement> {
  static values = {
    collapsible: { type: Boolean, default: false }
  }

  static targets = ['item', 'itemText', 'itemInput', 'undoButton'];
  declare readonly itemTargets: HTMLAnchorElement[];
  declare itemTextTargets: HTMLParagraphElement[];
  declare readonly itemInputTargets: HTMLInputElement[];
  declare undoButtonTargets: HTMLButtonElement[];

  connect() {
    if (this.itemTargets.length >= 2) {
      $(this.element).sortable({
        stop: (event: any, ui: any) => {
          console.log(event, ui)
        }
      });
    } 
  }

  disconnect() {
    if ($(this.element).data('uiSortable')) {
      $(this.element).sortable('destroy');
    }
  }
  
  onItemInput({ target: input }: { target: HTMLInputElement }) {
    const item = <HTMLAnchorElement>this.itemTargets.find(item => item.contains(input));
    const undoButton = <HTMLButtonElement>this.undoButtonTargets.find(button => item.contains(button));
    item.classList.toggle('will-be-updated', input.value !== input.dataset.initialValue);
    undoButton.setAttribute('data-tooltip-options-value', JSON.stringify({ title: 'Undo Changes' }));
  }

  remove({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const item = <HTMLAnchorElement>this.itemTargets.find(item => item.contains(button));
    const itemText = <HTMLParagraphElement>this.itemTextTargets.find(p => item.contains(p));
    const undoButton = <HTMLButtonElement>this.undoButtonTargets.find(button => item.contains(button));
    item.classList.add('will-be-removed');
    itemText.innerHTML = `<s>${itemText.textContent}</s>`;
    undoButton.setAttribute('data-tooltip-options-value', JSON.stringify({ title: 'Undo Delete' }));
    $(this.element).sortable('destroy')
    $(this.element).sortable({ items: '.list-group-item:not(.will-be-removed)' });
  }

  undo({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const item = <HTMLAnchorElement>this.itemTargets.find(item => item.contains(button));
    if (item.classList.contains('will-be-removed')) {
      const itemText = <HTMLParagraphElement>this.itemTextTargets.find(p => item.contains(p));
      itemText.innerHTML = itemText.innerText;
    } else {
      const itemInput = <HTMLInputElement>this.itemInputTargets.find(input => item.contains(input));
      itemInput.value = <string>itemInput.dataset.initialValue;
    }
    item.classList.remove('will-be-updated', 'will-be-removed');
    $(this.element).sortable('destroy')
    $(this.element).sortable({ items: '.list-group-item:not(.will-be-removed)' });
  }
}