import { Controller } from '@hotwired/stimulus';
import { type SearchParams, DataTableWrapper } from '../lib/datatables';
import { FetchRequest } from '@rails/request.js';

export default class DatatableController extends Controller<HTMLTableElement> {
  static values = { 
    init: { type: Boolean, default: false },
    searchParams: { type: Object, default: undefined },
    rowGroupEnabled: { type: Boolean, default: true },
    rowGroupColumn: { type: Number, default: undefined },
    reload: { type: String, default: undefined },
    redraw: { type: Boolean, default: undefined },
    page: { type: Number, default: undefined },
    rowLookup: { type: Object, default: undefined },
    resourceId: String
  };
  
  // static targets = ['row'];   // rowTargets exclude row groups
  // declare readonly rowTargets: HTMLTableRowElement[];

  declare dtWrapper: DataTableWrapper;
  private declare readonly initValue: boolean;
  private declare readonly searchParamsValue: SearchParams;
  private declare readonly rowGroupEnabledValue: boolean;
  private declare readonly rowGroupColumnValue: number;
  private declare reloadValue: string;
  private declare redrawValue: boolean;
  private declare readonly pageValue: number;
  private declare readonly rowLookupValue: { id?: number, position?: number };
  private declare readonly resourceIdValue: string;

  // NOTE: This may trigger multiple times, presumably due to datatables DOM manipulation
  // connect() {
  // }

  initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;

    this.dispatch('ready', { detail: { construct: this.constructTableWrapper.bind(this) } });
  }
  
  constructTableWrapper(config: import('datatables.net').Config) {
    this.dtWrapper = new DataTableWrapper(this.element, config)
  }

  searchParamsValueChanged(params: SearchParams) {
    this.dtWrapper.debouncedSearch(params);
  }

  rowGroupEnabledValueChanged(shouldEnable: boolean) {
    this.dtWrapper?.toggleRowGroup(shouldEnable && !!this.rowGroupColumnValue);
  }

  rowGroupColumnValueChanged(column: number, prevColumn: number) {
    this.dtWrapper?.handleRowGroupColumnChanged(column, prevColumn);
  }

  reloadValueChanged(resourceName: ResourceName) {
    if (this.dtWrapper && resourceName) {
      this.dtWrapper.reload(CSP[resourceName]);
    }
    this.reloadValue = '';
  }

  redrawValueChanged(shouldRedraw: boolean) {
    if (this.dtWrapper && shouldRedraw) {
      this.dtWrapper.redraw(false); // false => hold current paging
    }
    this.redrawValue = false;
  }

  pageValueChanged(page: number) {
    if (!this.dtWrapper || isNaN(page) || page < 0) return;

    this.dtWrapper.turnToPage(page);
    this.element.removeAttribute('data-datatable-page-value');
  }

  async deleteRow(e: CustomEvent<{ tr: HTMLTableRowElement, path: string, storyId?: number }>): Promise<void> {
    const { tr, path, storyId } = e.detail;
    const req = new FetchRequest('DELETE', path);
    const res = await req.perform();
    if (!res.ok) {
      // throw new Error(`Failed to delete row at ${path}: ${res.status} ${res.statusText}`);
    }

    const row = this.dtWrapper.row(tr);
    const id = row.data().id;
    if (row.child.isShown()) row.child.hide();
    row.remove();
    this.dtWrapper.redraw(false);
    this.dispatch('row-deleted', { detail: { id, storyId } });
  }

  rowLookupValueChanged({ id, position }: { id?: number, position?: number }) {
    const rows = this.dtWrapper.currentRows;
    const data = rows.data().toArray();
    const index = id ? data.findIndex(row => row.id === id) : (position ? position - 1 : -1);
    if (index === -1) return;

    // NOTE: The tr element for the row may not be currently displayed,
    // thus there is no access to the row controller and rowData
    const rowView = {
      page: Math.floor(index / <number>this.dtWrapper.pageLength()), 
      position: position || index + 1,
      turboFrame: { 
        id: `edit-${this.resourceIdValue.slice(0, -1)}`,
        src: data[index].edit_path 
      },
      actionsDropdownHtml: data[index].actions_dropdown_html
    };
    this.dispatch('row-lookup', { detail: rowView });
  }
}