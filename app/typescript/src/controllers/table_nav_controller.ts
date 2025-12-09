import { Controller } from '@hotwired/stimulus';

export default class TableNavController extends Controller<HTMLElement> {
  // These targets' children are replaced by the ResourceController when a table is drawn
  static targets = ['info', 'paginate', 'position', 'prevRowViewBtn', 'nextRowViewBtn'];
  declare readonly infoTarget: HTMLElement; // "x to y of z" 
  declare readonly paginateTarget: HTMLElement; // previous/next buttons
  declare readonly positionTarget: HTMLElement; // current position
  declare readonly prevRowViewBtnTarget: HTMLButtonElement;
  declare readonly nextRowViewBtnTarget: HTMLButtonElement;

  static values = {
    rowPosition: { type: Number, default: undefined },
    pageInfo: { type: Object, default: undefined }
  }
  declare rowPositionValue: number | undefined;
  declare pageInfoValue: ApiPageInfo;

  declare observer: MutationObserver;
  
  connect() {
    // When the table draws, the `.dataTables_info` and `.dataTables_paginate` elements are
    // cloned into the info and paginate targets respectively. (see drawCallback in table config)
    this.observer = new MutationObserver(mutations => {
      // This resolves a timing issue that arises when info is updated after a row view is opened
      if (this.positionTarget.textContent) {
        this.positionTarget.textContent = this.positionTarget.textContent.replace(
          /of \d+$/,
          `of ${this.pageInfoValue.recordsDisplay}`
        )
      }
    });
    this.observer.observe(this.infoTarget, { childList: true, subtree: false });
  }

  disconnect() {
    this.observer.disconnect();
  }

  rowPositionValueChanged(position: number) {
    this.positionTarget.textContent = position ? 
      `${position} of ${this.pageInfoValue.recordsDisplay}` : 
      '';

    // We don't want to disable the buttons because this will result in styling
    // that is not consistent with datatables styling of the pagination buttons 
    // (which are actually links and thus can't be disabled)
    this.prevRowViewBtnTarget
      .setAttribute('aria-disabled', position === this.currentRangeStart ? 'true' : 'false');
    this.prevRowViewBtnTarget.style.cursor = (
      position === this.currentRangeStart ? 'not-allowed' : 'pointer'
    );
    this.nextRowViewBtnTarget
      .setAttribute('aria-disabled', position === this.currentRangeEnd ? 'true' : 'false');
    this.nextRowViewBtnTarget.style.cursor = (
      position === this.currentRangeEnd ? 'not-allowed' : 'pointer'
    );
  }

  // TODO: if a boundary is reached, turn the table page if possible
  stepRowView({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
    if (!this.rowPositionValue) return;
    if (btn.ariaDisabled === 'true') return;
    
    const step = +(<string>btn.dataset.step);
    this.dispatch('step-row-view', { detail: { position: this.rowPositionValue + step } });
  }
}