import DatatableRowController from './datatable_row_controller';
import type { FrameElement } from '@hotwired/turbo';

export default class PromotedStoryController extends DatatableRowController<PromotedStoryController, AdwordsAdRowData> {
  static targets = ['statusForm', 'statusCheckbox', 'statusLabel'];
  declare readonly statusFormTarget: HTMLFormElement;
  declare readonly statusCheckboxTargets: HTMLInputElement[];
  declare readonly statusLabelTarget: HTMLElement;

  declare path: string;
  declare promotedStoryHtml: HTMLElement;
  declare $statusSwitch: JQuery<HTMLInputElement, any>;

  connect() {
    this.$statusSwitch = $(<HTMLInputElement>this.statusCheckboxTargets.find(checkbox => checkbox.value === 'ENABLED'));
  }

  onFrameRendered({ target: turboFrame }: {target: FrameElement}) {
    this.promotedStoryHtml ??= <HTMLElement>turboFrame.firstElementChild;
  }

  get childRowContent() {
    return this.promotedStoryHtml || '<h3>Promoted Story</h3>';
  }

  onAjaxSuccess({ detail: [data] }: { detail: [data: { changes: { [key: string]: any } }] }) {
    if (data.changes.status) {
      const [ , newStatus ] = data.changes.status;
      this.$statusSwitch.bootstrapSwitch('disabled', false);
      this.statusLabelTarget.textContent = newStatus;
    }
  }

  updateStatus({ detail: { state } }: { detail: { state: boolean } }) {
    this.statusCheckboxTargets.forEach((checkbox: HTMLInputElement) => {
      checkbox.checked = checkbox.value === 'ENABLED' ? state : !state;
    });
    this.statusFormTarget.requestSubmit();
    this.$statusSwitch.bootstrapSwitch('disabled', true);
    this.statusLabelTarget.textContent = '\u00A0';
  }
}