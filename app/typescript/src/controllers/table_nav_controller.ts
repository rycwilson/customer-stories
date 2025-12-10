import { Controller } from '@hotwired/stimulus';
import type { ApiPageInfo } from 'datatables.net';

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
      .setAttribute('aria-disabled', position === 1 ? 'true' : 'false');
    this.prevRowViewBtnTarget.style.cursor = position === 1 ? 'not-allowed' : 'pointer';
    this.nextRowViewBtnTarget
      .setAttribute('aria-disabled', position === this.pageInfoValue.recordsDisplay ? 'true' : 'false');
    this.nextRowViewBtnTarget.style.cursor = (
      position === this.pageInfoValue.recordsDisplay ? 'not-allowed' : 'pointer'
    );
  }
  
  stepRowView({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
    if (!this.rowPositionValue) return;
    if (btn.ariaDisabled === 'true') return;

    const step = +(<string>btn.dataset.step);
    const newRowPosition = this.rowPositionValue + step;

    // Note that pages are 0-based while position is 1-based
    const isPrevPage = (newRowPosition - 1) < this.pageInfoValue.start;
    const isNextPage = (newRowPosition - 1) > this.pageInfoValue.end;
    const newPage = isPrevPage || isNextPage ? this.pageInfoValue.page + step : undefined;
    this.dispatch('step-row-view', { detail: { position: newRowPosition, newPage } });
  }
}