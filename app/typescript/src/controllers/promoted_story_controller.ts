import DatatableRowController from './datatable_row_controller';
import type { FrameElement, TurboSubmitEndEvent } from '@hotwired/turbo';

export default class PromotedStoryController extends DatatableRowController<PromotedStoryController, AdwordsAdRowData> {
  static targets = ['statusForm', 'statusCheckbox', 'statusLabel'];
  declare readonly statusFormTarget: HTMLFormElement;
  declare readonly statusCheckboxTargets: HTMLInputElement[];
  declare readonly statusLabelTarget: HTMLElement;

  declare path: string;
  declare promotedStoryHtml: HTMLElement;
  declare $statusSwitch: JQuery<HTMLInputElement, any>;

  get childRowContent() {
    return this.promotedStoryHtml || '<h3>Promoted Story</h3>';
  }
  
  connect() {
    super.connect();
    this.$statusSwitch = $(<HTMLInputElement>this.statusCheckboxTargets.find(checkbox => checkbox.value === 'ENABLED'));
  }

  onFrameRendered({ target: turboFrame }: {target: FrameElement}) {
    this.promotedStoryHtml ??= <HTMLElement>turboFrame.firstElementChild;
  }

  onUpdatedStatusSuccess(shouldEnable: boolean, e: TurboSubmitEndEvent) {
    this.$statusSwitch.bootstrapSwitch('disabled', false);
    this.statusLabelTarget.textContent = shouldEnable ? 'ENABLED' : 'PAUSED';
    this.updateRow({ status: shouldEnable ? 'ENABLED' : 'PAUSED' });
  }

  updateStatus({ detail: { state: shouldEnable } }: { detail: { state: boolean } }) {
    this.statusCheckboxTargets.forEach((checkbox: HTMLInputElement) => {
      if (checkbox.type !== 'checkbox') return;
      checkbox.checked = shouldEnable;
    });
    this.element.addEventListener(
      'turbo:submit-end', 
      this.onUpdatedStatusSuccess.bind(this, shouldEnable), { once: true }
    );
    this.statusFormTarget.requestSubmit();

    // The switch must be disalbed AFTER the form is submitted, otherwise the switch will toggle back to its previous state
    this.$statusSwitch.bootstrapSwitch('disabled', true);
    this.statusLabelTarget.textContent = '\u00A0';
  }
}