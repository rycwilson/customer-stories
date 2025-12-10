import { Controller } from '@hotwired/stimulus';
import type { FrameElement } from '@hotwired/turbo';
import { FetchRequest } from '@rails/request.js';
import type DatatableController from './datatable_controller';
import type CustomerWinController from './customer_win_controller';
import type ContributionController from './contribution_controller';
import type PromotedStoryController from './promoted_story_controller';

type RowController = CustomerWinController | ContributionController | PromotedStoryController;
type RowData = CustomerWinRowData | ContributionRowData | AdwordsAdRowData;

export default class DatatableRowController<Ctrl extends RowController, Data extends RowData>
extends Controller<HTMLTableRowElement> {
  static outlets = ['datatable'];
  declare readonly datatableOutlet: DatatableController;

  static values = { 
    rowData: Object,
    // childRowTurboFrameAttrs: { type: Object, default: {} }
  };
  declare readonly rowDataValue: Data;
  declare childRowElement: HTMLElement;

  // The datatables .child method will take a HTMLElement or string
  // Subclasses may provide their own content, else default content may be defined here
  get childRowContent(): HTMLElement | string {
    return '<p>Child row content</p>';
  }

  get row() {
    return this.datatableOutlet.dt.row(this.element); 
  }

  initialize() {
    this.element.id = `${this.identifier}-${this.rowDataValue.id}`;
  }

  // connect() {
    // console.log('connecting', this.element.id)
  // }
  
  // disconnect() {
    // console.log('disconnecting', this.element.id)
  // }

  openView({ target }: { target: Element }) {
    if (target.closest('.toggle-child') || target.closest('[data-controller="dropdown"]')) return;

    const rows = this.datatableOutlet.dt.rows({ search: 'applied' });
    const data = rows.data().toArray();
    const index = data.findIndex(row => row.id === this.rowDataValue.id);
    const rowView = {
      position: index + 1,
      turboFrame: this.rowDataValue.turboFrame,
      actionsDropdownHtml: data[index].actions_dropdown_html
    }
    this.dispatch('row-clicked', { detail: rowView });
  }

  toggleChildRow() {
    if (this.row.child.isShown()) {
      this.row.child.hide();
    } else {
      this.row.child(this.childRowContent, 'child-row');
      this.row.child.show();
      const childRow = this.element.nextElementSibling as HTMLTableRowElement;
      if (this.onFrameRendered) {
        childRow.addEventListener('turbo:frame-render', this.onFrameRendered.bind(this), { once: true });
      }
      childRow && childRow.scrollIntoView({ block: 'center' });
    }
  }

  onFrameRendered({ target: turboFrame }: {target: FrameElement}) {
    this.childRowElement ??= <HTMLElement>turboFrame.firstElementChild;
  }

  updateRow(data: object) {
    this.row.data({ ...this.row.data(), ...data });
    this.row.invalidate();
    // TODO update CSP.promotedStories
  }

  async deleteRow(this: Ctrl) {
    // return fetch(this.path, { 
    //   method: 'DELETE',
    //   headers: {
    //     'X-CSRF-Token': (<HTMLMetaElement>document.querySelector('[name="csrf-token"]')).content
    //   },

    // // read the response (even though it's empty) lest the fetch method interpret the empty response as failure
    // }).then(res => res.text())
    //   .then((body) => {
    //     // body is empty
    //     this.row.remove().draw();
    //   });
    const request = new FetchRequest('DELETE', this.rowDataValue.path);
    const response = await request.perform();
    if (response.ok) {
      this.row.remove().draw();
    }
  }

  onShownDropdown(e: CustomEvent) {
    this.element.classList.add('active');
  }

  onHiddenDropdown(e: CustomEvent) {
    if (!this.row.child.isShown()) {
      this.element.classList.remove('active');
    }
  }
}