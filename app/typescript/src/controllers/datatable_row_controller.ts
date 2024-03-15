import { Controller } from '@hotwired/stimulus';
import type DatatableController from './datatable_controller';
import type CustomerWinController from './customer_win_controller';
import type ContributionController from './contribution_controller';
import type PromotedStoryController from './promoted_story_controller';

type RowController = CustomerWinController | ContributionController | PromotedStoryController;
type RowData = (CustomerWinRowData | ContributionRowData | PromotedStoryRowData) & StringIndexable;
export default class DatatableRowController<Ctrl extends RowController, Data extends RowData> extends Controller<HTMLTableRowElement> {
  static outlets = ['datatable', 'modal'];
  declare readonly datatableOutlet: DatatableController;

  static targets = ['actionsDropdown'];
  declare readonly actionsDropdownTarget: HTMLTableCellElement;

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
    this.actionsDropdownTarget.insertAdjacentHTML('afterbegin', this.actionsDropdownTemplate);
    this.element.id = `${this.identifier}-${this.rowDataValue.id}`;
  }

  connect() {
    // console.log('connect datatable row', this.identifier)
  }

  get dt() {
    return this.datatableOutlet.dt;
  }

  get actionsDropdownTemplate(): string {
    throw new Error('actionsDropdownTemplate must be implemented in subclass');
  }

  get hasChildRowContent() {
    // const { id, src } = this.childRowTurboFrameAttrsValue;
    // return id && src;
    return true;
  }

  toggleChildRow(this: Ctrl) {
    if (!this.hasChildRowContent) return false;
    // const { content, onFrameRendered } = e.detail;
    const tr = this.element;
    const row = this.dt.row(tr);
    if (row.child.isShown()) {
      row.child.hide();
    } else {
      row.child(this.childRowContent, 'child-row');
      row.child.show();
      const childRow = tr.nextElementSibling as HTMLTableRowElement;
      if (this.onFrameRendered) {
        childRow.addEventListener('turbo:frame-render', this.onFrameRendered.bind(this), { once: true });
      }
      childRow && childRow.scrollIntoView({ block: 'center' });
    }
  }

  deleteRow() {
  }
}