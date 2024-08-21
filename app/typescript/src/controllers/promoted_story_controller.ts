import DatatableRowController from './datatable_row_controller';
import type { FrameElement } from '@hotwired/turbo';

export default class PromotedStoryController extends DatatableRowController<PromotedStoryController, PromotedStoryRowData> {
  declare id: number;
  declare title: string;
  declare path: string;
  declare promotedStoryHtml: HTMLElement;

  onFrameRendered({ target: turboFrame }: {target: FrameElement}) {
    this.promotedStoryHtml ??= <HTMLElement>turboFrame.firstElementChild;
  }

  get childRowContent() {
    return this.promotedStoryHtml || '<h3>Promoted Story</h3>';
  }

  get actionsDropdownTemplate() {
    return `
      <a id="promoted-story-actions-dropdown-${this.id}" 
        href="#" 
        class="dropdown-toggle" 
        data-toggle="dropdown"
        aria-haspopup="true" 
        aria-expanded="false">
        <i class="fa fa-caret-down"></i>
      </a>
      <ul class="dropdown-menu dropdown-menu-right aria-labelledby="promoted-story-actions-dropdown-${this.id}"">
      <li>
        <a role="button">
          <i class="fa fa-fw fa-image action"></i>&nbsp;&nbsp;
          <span>Assign Images</span>
        </a>
      </li>
      <li>
        <a href="/promote/preview/${this.id}" target="_blank">
          <i class="fa fa-fw fa-external-link action"></i>&nbsp;&nbsp;
          <span>Preview</span>
        </a>
      </li>
    `
  }
}