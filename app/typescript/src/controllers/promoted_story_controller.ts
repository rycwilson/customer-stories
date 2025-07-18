import DatatableRowController from './datatable_row_controller';
import type { FrameElement, TurboSubmitEndEvent } from '@hotwired/turbo';
import { FetchRequest } from '@rails/request.js';

export default class PromotedStoryController extends DatatableRowController<PromotedStoryController, AdwordsAdRowData> {
  static targets = ['statusLabel'];
  declare readonly statusLabelTarget: HTMLElement;

  declare path: string;
  declare promotedStoryHtml: HTMLElement;

  get childRowContent() {
    return this.promotedStoryHtml || '<h3>Promoted Story</h3>';
  }

  // Since the row will be re-drawn upon updating the status, do not rely on a stimulus target for the switch.
  get $statusSwitch() {
    const switchContainer = this.element.querySelector('.bootstrap-switch-container');
    const checkbox = switchContainer?.querySelector('input[type="checkbox"]');
    return $(checkbox);
  }

  // Child row content is loaded via turbo frame
  // TODO: update the cached reference (this.promotedStoryHtml) as necessary 
  onFrameRendered({ target: turboFrame }: {target: FrameElement}) {
    this.promotedStoryHtml ??= <HTMLElement>turboFrame.firstElementChild;
  }

  async updateStatus({ detail: { state: shouldEnable } }: { detail: { state: boolean } }) {
    const newStatus = shouldEnable ? 'ENABLED' : 'PAUSED';
    this.$statusSwitch.bootstrapSwitch('disabled', true);
    this.statusLabelTarget.textContent = '\u00A0'; // unbreakable space prevents the elment from collapsing
    const request = new FetchRequest('patch', this.path, {
      body: { adwords_ad: { status: newStatus } },
      responseKind: 'turbo-stream'
    });
    const response = await request.perform();
    this.$statusSwitch.bootstrapSwitch('disabled', false);
    if (response.ok) {
      this.statusLabelTarget.textContent = newStatus;
      this.updateRow({ status: newStatus });
    } else {
      this.$statusSwitch.bootstrapSwitch('state', !shouldEnable, true);
      this.statusLabelTarget.textContent = 'ERROR';
    }
  }
}