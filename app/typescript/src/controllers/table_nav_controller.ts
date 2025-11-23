import { Controller } from '@hotwired/stimulus';

export default class TableNavController extends Controller<HTMLElement> {
  // These targets' children are replaced by the ResourceController when a table is drawn
  static targets = ['info', 'paginate', 'position', 'prevPartialBtn', 'nextPartialBtn'];
  declare readonly infoTarget: HTMLElement; // "x to y of z" 
  declare readonly paginateTarget: HTMLElement; // previous/next buttons
  declare readonly positionTarget: HTMLElement; // current position
  declare readonly prevPartialBtnTarget: HTMLButtonElement;
  declare readonly nextPartialBtnTarget: HTMLButtonElement;

  static values = {
    rowPosition: { type: Number, default: undefined }
  }
  declare rowPositionValue: number | undefined;

  declare observer: MutationObserver;
  declare currentRangeStart: number;
  declare currentRangeEnd: number;
  declare totalRows: number;
  
  connect() {
    // When the table draws, the `.dataTables_info` and `.dataTables_paginate` elements are
    // cloned into the info and paginate targets respectively. (see drawCallback in table config)
    // When this happens, keep track of the current page range
    // Ignore the change when a row partial is displayed.
    this.observer = new MutationObserver(mutations => {
      // Ignore the change to the info target when it reflects the current opened row partial
      if (this.rowPositionValue) return;

      const currentRange = <string>(
        mutations[0].addedNodes[0].textContent!.match(/^(?<range>\d+ to \d+)/)!.groups!.range
      );
      [this.currentRangeStart, this.currentRangeEnd] = currentRange.split(' to ').map(Number);
    });
    this.observer.observe(this.infoTarget, { childList: true, subtree: false });
  }

  disconnect() {
    this.observer.disconnect();
  }

  rowPositionValueChanged(newVal: number, oldVal: number) {
    this.positionTarget.textContent = newVal ?
      `${newVal} ` + this.infoTarget.innerText.match(/(?<substr>of \d+)$/)!.groups!.substr :
      '';

    // We don't want to disable the buttons because this will result in styling
    // that is not consistent with datatables styling of the pagination buttons 
    // (which are actually links and thus can't be disabled)
    this.prevPartialBtnTarget.setAttribute('aria-disabled', newVal === this.currentRangeStart ? 'true' : 'false');
    this.prevPartialBtnTarget.style.cursor = newVal === this.currentRangeStart ? 'not-allowed' : 'pointer';
    this.nextPartialBtnTarget.setAttribute('aria-disabled', newVal === this.currentRangeEnd ? 'true' : 'false');
    this.nextPartialBtnTarget.style.cursor = newVal === this.currentRangeEnd ? 'not-allowed' : 'pointer';
  }

  // TODO: if a boundary is reached, turn the table page if possible
  stepRowPartial({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
    if (!this.rowPositionValue) return;
    if (btn.ariaDisabled === 'true') return;
    
    const step = +(<string>btn.dataset.step);
    this.dispatch('step-row-partial', { detail: { position: this.rowPositionValue + step } });
  }
}