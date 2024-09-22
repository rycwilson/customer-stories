import DatatableRowController from './datatable_row_controller';
import type { FrameElement } from '@hotwired/turbo';

export default class PromotedStoryController extends DatatableRowController<PromotedStoryController, PromotedStoryRowData> {
  declare id: number;
  declare title: string;
  declare editAdImagesPath: string;
  declare promotedStoryHtml: HTMLElement;

  onFrameRendered({ target: turboFrame }: {target: FrameElement}) {
    this.promotedStoryHtml ??= <HTMLElement>turboFrame.firstElementChild;
  }

  get childRowContent() {
    return this.promotedStoryHtml || '<h3>Promoted Story</h3>';

  }
}