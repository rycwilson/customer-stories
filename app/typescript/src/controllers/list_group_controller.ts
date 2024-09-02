import { Controller } from '@hotwired/stimulus';

export default class ListGroupController extends Controller<HTMLUListElement> {
  static values = {
    collapsible: { type: Boolean, default: false }
  }
  declare readonly collapsibleValue: boolean;

  static targets = ['item', 'itemText', 'itemInput', 'undoButton', 'collapse'];
  declare readonly itemTargets: HTMLAnchorElement[];
  declare itemTextTargets: HTMLParagraphElement[];
  declare readonly itemInputTargets: HTMLInputElement[];
  declare undoButtonTargets: HTMLButtonElement[];
  declare collapseTargets: HTMLDivElement[];

  allCollapsed: boolean | undefined = undefined;

  connect() {
    this.initSortable();
    if (this.collapsibleValue) this.initCollapsible();
  }

  disconnect() {
    if ($(this.element).data('uiSortable')) {
      $(this.element).sortable('destroy');
    }
  }

  initCollapsible() {
    this.allCollapsed = true;
    this.collapseTargets.forEach(collapsible => {
      $(collapsible).on('shown.bs.collapse hidden.bs.collapse', (e: Event) => {
        this.allCollapsed = this.itemTargets.filter(item => item.getAttribute('aria-expanded') === 'true').length === 0;
        if (!this.allCollapsed) {
          $(this.element).sortable('destroy');
        } else if (!$(this.element).data('uiSortable')) {
          this.initSortable();
        }
      });
    });
  }

  initSortable() {
    if (this.itemTargets.length < 2) return; 
    const ctrl = this;
    $(this.element).sortable({
      items: '.list-group-item',
      helper: (e: Event, item: JQuery<HTMLAnchorElement, any>) => (
        item.clone().css('width', item.css('width')).find('button').remove().end()
      ),
      start(e: Event, ui: any) {
        // console.log('start', e)
      },
      stop: (e: Event, ui: any) => {
        // console.log('stop', e)
        ctrl.itemTargets.forEach(item => {
          const collapsible = ctrl.collapseTargets.find(_collapsible => item.href.includes(`#${_collapsible.id}`));
          $(item).after(collapsible);
        });
      }
    });
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