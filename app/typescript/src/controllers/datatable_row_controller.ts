import { Controller } from '@hotwired/stimulus';
import type DatatableController from './datatable_controller';
import type CustomerWinController from './customer_win_controller';
import type ContributionController from './contribution_controller';
import type PromotedStoryController from './promoted_story_controller';

type RowController = CustomerWinController | ContributionController | PromotedStoryController;
type RowData = (CustomerWinRowData | ContributionRowData | AdwordsAdRowData) & StringIndexable;
export default class DatatableRowController<Ctrl extends RowController, Data extends RowData> extends Controller<HTMLTableRowElement> {
  static outlets = ['datatable'];
  declare readonly datatableOutlet: DatatableController;

  static values = { 
    rowData: Object,
    childRowTurboFrameAttrs: { type: Object, default: {} }
  };
  declare readonly rowDataValue: Data;
  declare readonly childRowTurboFrameAttrsValue: { id: string, src: string };

  initialize() {
    Object.keys(this.rowDataValue).forEach(key => {
      // when accessing a property from outside the class (here we are accessing the subclass from the superclass), 
      // typescript is unaware of string index signature 
      // => use `as any`
      (this as any)[key] = this.rowDataValue[key];
    });
    this.element.id = `${this.identifier}-${this.rowDataValue.id}`;
  }

  connect() {
    
  }

  get row() {
    return this.datatableOutlet.dt.row(this.element); 
  }

  get hasChildRowContent() {
    // const { id, src } = this.childRowTurboFrameAttrsValue;
    // return id && src;
    return true;
  }

  toggleChildRow(this: Ctrl) {
    if (!this.hasChildRowContent) return false;
    // const { content, onFrameRendered } = e.detail;
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

  updateRow(data: object) {
    this.row.data({ ...this.row.data(), ...data });
    this.row.invalidate();
    // TODO update CSP.promotedStories
  }

  deleteRow(this: Ctrl) {
    return fetch(this.path, { 
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': (<HTMLMetaElement>document.querySelector('[name="csrf-token"]')).content
      },

    // read the response (even though it's empty) lest the fetch method interpret the empty response as failure
    }).then(res => res.text())
      .then((body) => {
        // body is empty
        this.row.remove().draw();
      });
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