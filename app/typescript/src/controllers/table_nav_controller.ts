import { Controller } from '@hotwired/stimulus';

export default class TableNavController extends Controller<HTMLElement> {
  static targets = ['info', 'paginate'];
  declare readonly infoTarget: HTMLElement;
  declare readonly paginateTarget: HTMLElement;

  static values = {
    currentRow: { type: Number, default: undefined }
  }

  declare observer: MutationObserver;
  declare currentRangeStart: number;
  declare currentRangeEnd: number;
  declare totalRows: number;
  
  connect() {
    this.observer = new MutationObserver(mutations => {
      const currentRange = <string>(
        mutations[0].addedNodes[0].textContent!.match(/^(?<range>\d+ to \d+)/)!.groups!.range
      );
      this.currentRangeStart = +currentRange.split(' to ')[0];
      this.currentRangeEnd = +currentRange.split(' to ')[1];
    });
    this.observer.observe(this.infoTarget, { childList: true, subtree: false });
  }

  disconnect() {
    this.observer.disconnect();
  }

  currentRowValueChanged(position: number) {
    if (position) {
      this.infoTarget.innerText = this.infoTarget.innerText
        .replace(/^\d+ to \d+/, position.toString());
    } else {
      this.infoTarget.innerText = this.infoTarget.innerText
        .replace(/^\d+/, `${this.currentRangeStart} to ${this.currentRangeEnd}`);
    }
  }
}