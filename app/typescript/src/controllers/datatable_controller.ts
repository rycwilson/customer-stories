import { Controller } from "@hotwired/stimulus";
import type ResourceController from "./resource_controller";
import DataTable from 'datatables.net-bs';
import type { Api, Config } from 'datatables.net-bs';
import 'datatables.net-rowgroup-bs';

interface SearchParams {
  curatorId: string,
  columnFilters: { column: string, q: string, regEx: boolean, smartSearch: boolean }[],
  tsSearchResults?: { [column: string]: string },
  filterVal?: string
}
export default class DatatableController extends Controller<HTMLTableElement> {
  static outlets = ['resource', 'stories'];
  declare readonly resourceOutlet: ResourceController;
  declare readonly storiesOutlet: ResourceController;

  // static targets = ['row'];   // rowTargets exclude row groups
  // declare readonly rowTargets: HTMLTableRowElement[];

  static values = { 
    ready: { type: Boolean, default: false },
    enableRowGroups: { type: Boolean, default: false },
    searchParams: Object
  };
  declare readyValue: boolean;
  declare enableRowGroupsValue: boolean;
  declare searchParamsValue: SearchParams | undefined;

  declare dt: Api<any>
  didInitialize = false;
  declare searchDebounceTimer: number;

  connect() {
  }
  
  get baseOptions(): Config {
    const ctrl = this;
    return {
      deferRender: true,
      autoWidth: false,
      dom: 'tip',
      pageLength: 75,
      drawCallback(settings: object) {
        // console.log('drawCallback()')
        if (ctrl.didInitialize) ctrl.redrawRowGroups();
        ctrl.dispatch('drawn');
      },

      // TODO: what is the type of this?
      initComplete(this: any, settings: object) {
        // console.log('initComplete()')
        ctrl.cloneFilterResults();
        ctrl.didInitialize = true;
        ctrl.dispatch('init', { detail: { dt: this.api() } });
      }
    }
  };

  readyValueChanged(dataIsReady: boolean) {
    // console.log('dataIsReady', dataIsReady)
    if (dataIsReady) {
      this.dt = new DataTable(
        this.element, 
        { ...this.baseOptions, ...this.resourceOutlet.tableConfig() }
      );
    }
  }

  searchParamsValueChanged(newVal: SearchParams, oldVal: SearchParams | undefined) {
    if (oldVal !== undefined) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = window.setTimeout(() => this.search(newVal), 200);
    }
  }

  toggleChildRow(e: CustomEvent) {
    const { tr, content, onFrameRendered } = e.detail;
    const row = this.dt.row(tr);
    if (row.child.isShown()) {
      row.child.hide();
    } else {
      row.child(content, 'child-row');
      row.child.show();
      const childRow = tr.nextElementSibling;
      if (onFrameRendered) childRow.addEventListener('turbo:frame-render', onFrameRendered, { once: true });
      childRow && childRow.scrollIntoView({ block: 'center' });
    }
  }

  search({ curatorId, columnFilters, filterVal, tsSearchResults }: SearchParams) {
    // console.log('curatorId: ', curatorId)
    // console.log('columnFilters: ', columnFilters)
    // console.log('filterVal: ', filterVal)
    // console.log('tsSearchResults: ', tsSearchResults)
    let dtSearch = this.dt.search('')
    dtSearch.columns().search('') 
    dtSearch.column('curator:name').search(curatorId ? `^${curatorId}$` : '', true, false);

    columnFilters.forEach(({ column, q, regEx: isRegEx, smartSearch: useSmartSearch }) => {
      dtSearch = dtSearch.column(`${column}:name`).search(q, isRegEx, useSmartSearch);
    });
    
    // as the user types, search the table for the found options in the select box
    // => this ensures the datatables search matches the tomselect search
    if (tsSearchResults) {
      Object.keys(tsSearchResults).forEach(column => {
        dtSearch = dtSearch.column(`${column}:name`).search(`^(${tsSearchResults[column]})$`, true, false);
      });
    } else if (filterVal) {
      const column = filterVal.slice(0, filterVal.indexOf('-'));
      const id = filterVal.slice(filterVal.indexOf('-') + 1, filterVal.length);
      // console.log(`${column}:name`, `^${id}$`)
      dtSearch = dtSearch.column(`${column}:name`).search(`^${id}$`, true, false);
    }
    dtSearch.draw();
  }

  // toggle table stripes when alternating between row grouping and no row grouping
  // the Datatables table-striped class does not take row groups into account, hence this approach
  enableRowGroupsValueChanged(shouldEnable: boolean) {
    if (this.didInitialize) {
      // this.element.classList.toggle('has-row-groups');
      // this.rowTargets.forEach(tr => tr.classList.remove('even', 'odd'));
      // if (!shouldEnable) this.rowTargets.forEach((tr, i) => tr.classList.add(i % 2 === 0 ? 'even' : 'odd'));

      if (this.resourceOutlet.resourceName === 'customerWins') {
        if (shouldEnable) {
          this.dt.order([[2, 'asc'], [1, 'desc']]).draw();
        } else {
          this.dt.order([1, 'desc']).draw();
        }
      } else {
        this.dt.draw();
      }
    }
  }

  redrawRowGroups() {
    const rowGroups = this.dt.rowGroup();
    const shouldEnable = this.enableRowGroupsValue;
    const shouldRedraw = (!shouldEnable && rowGroups.enabled()) || (shouldEnable && !rowGroups.enabled());
    
    // without a timeout, the row groups get duplicated
    setTimeout(() => {
      if (shouldEnable && shouldRedraw) rowGroups.enable().draw();
      if (!shouldEnable && shouldRedraw) rowGroups.disable().draw();
      if (shouldRedraw) this.element.classList.toggle('has-row-groups');
    })
  }

  cloneFilterResults() {
    const originalResults = this.element.nextElementSibling;
    if (!originalResults) return;
    const clone = originalResults.cloneNode() as HTMLElement;
    const formatText = () => clone.textContent = originalResults.textContent?.replace(/\sentries/g, '') || null;
    clone.id = `${originalResults.id}--clone`;
    formatText();
    this.resourceOutlet.filterResultsTarget.appendChild(clone);
    $(this.element).on('draw.dt', formatText);
  }
}