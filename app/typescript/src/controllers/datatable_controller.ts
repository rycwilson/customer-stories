import { Controller } from '@hotwired/stimulus';
import type CustomerWinsController from './customer_wins_controller';
import type ContributionsController from './contributions_controller';
import type PromotedStoriesController from './promoted_stories_controller';
import DataTable from 'datatables.net-bs';
import type { Api, Config } from 'datatables.net-bs';
import 'datatables.net-rowgroup-bs';

interface SearchParams {
  filters: { column: string, q: string, regEx: boolean, smartSearch: boolean }[],
  tsSearchResults?: { [column: string]: string },
  searchVal?: string
}

export default class DatatableController extends Controller<HTMLTableElement> {
  static outlets = ['customer-wins', 'contributions', 'promoted-stories'];
  declare readonly hasCustomerWinsOutlet: boolean;
  declare readonly customerWinsOutlet: CustomerWinsController;
  declare readonly hasContributionsOutlet: boolean;
  declare readonly contributionsOutlet: ContributionsController;
  declare readonly hasPromotedStoriesOutlet: boolean;
  declare readonly promotedStoriesOutlet: PromotedStoriesController;

  // static targets = ['row'];   // rowTargets exclude row groups
  // declare readonly rowTargets: HTMLTableRowElement[];

  static values = { 
    init: { type: Boolean, default: false },
    searchParams: Object,
    rowGroupDataSource: { type: String }
  };
  declare initValue: boolean;
  declare searchParamsValue: SearchParams;
  declare rowGroupDataSourceValue: string | undefined;

  declare dt: Api<any>;
  declare searchDebounceTimer: number;
  
  handleColumnSort = this.onColumnSort.bind(this);

  get resourceOutlet(): ResourceControllerWithDatatable {
    if (this.hasCustomerWinsOutlet) return this.customerWinsOutlet;
    if (this.hasContributionsOutlet) return this.contributionsOutlet;
    if (this.hasPromotedStoriesOutlet) return this.promotedStoriesOutlet;
    throw new Error('No valid resource outlet found.')
  }

  get baseConfig(): Config {
    const ctrl = this;
    return {
      deferRender: true,
      autoWidth: false,
      dom: 'tip',
      pageLength: 50,
      drawCallback(this: JQuery<HTMLTableElement, any>, settings: object) {
        this.find('th.sorting').each((i: number, th: HTMLTableCellElement) => {
          th.removeEventListener('click', ctrl.handleColumnSort, true);
          th.addEventListener('click', ctrl.handleColumnSort, true);
        });
        ctrl.dispatch('drawn');
      },
      initComplete(this: any, settings: object) {
        ctrl.cloneFilterResults();
        ctrl.dispatch('init', { detail: { dt: this.api() } });
      }
    }
  };

  get rowGroupColumnIndex(): number | undefined {
    if (!this.rowGroupDataSourceValue) return;
    
    let columnName = this.rowGroupDataSourceValue.split('.')[0];
    
    // For looking up the column index, we must reference column names, not data properties,
    // and the customer win column is still named 'success' due to select options e.g. 'success-1'
    if (columnName === 'customer_win') columnName = 'success';

    // TODO: Upgrade to datatables v2
    // https://stackoverflow.com/questions/76804086
    return this.dt.columns(`${columnName}:name`).indexes()[0];
  }

  initValueChanged(shouldInit: boolean) {
    if (shouldInit) {
      this.dt = new DataTable(
        this.element, 
        { ...this.baseConfig, ...this.resourceOutlet.tableConfig }
      );
    }
  }

  searchParamsValueChanged(newVal: SearchParams, oldVal: SearchParams | undefined) {
    if (oldVal === undefined) return; // skip on initial connect

    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = window.setTimeout(() => this.search(newVal), 200);
  }

  rowGroupDataSourceValueChanged(source: string) {
    // ResourceController will pass down the value when it connects.
    // Don't handle the change unless the table is initialized.
    if (!this.dt) return;

    // Get either the only current sort (row group disabled), 
    // or the current secondary sort (row groups enabled)
    const [sortColumnIndex, sortDirection] = this.dt.order().pop() as [number, 'asc' | 'desc'];

    this.resourceOutlet.toggleColumns(this.dt, source);

    if (this.rowGroupColumnIndex) {
      this.dt.rowGroup().enable();
      this.dt.rowGroup().dataSrc(source);
      this.dt.order([
        [this.rowGroupColumnIndex, sortColumnIndex === this.rowGroupColumnIndex ? sortDirection : 'asc'], 
        [sortColumnIndex, sortDirection]
      ]); 
    } else {
      this.dt.rowGroup().disable();
      this.dt.order([[sortColumnIndex, sortDirection]]); // current sort
    }
    this.dt.draw();
  }

  // We want to preserve row group sorting (if present) when the user sorts a column.
  // Intercept th clicks and manually execute the sort.
  onColumnSort(e: Event) {
    e.stopPropagation();
    const th = e.currentTarget as HTMLTableCellElement;
    const columnIndex = this.dt.column(th).index();
    const isDefaultSort = (
      !th.classList.contains('sorting_asc') && !th.classList.contains('sorting_desc')
    );
    const direction = isDefaultSort || th.classList.contains('sorting_desc') ? 'asc' : 'desc';
    const userSort = [columnIndex, direction];
    if (this.dt.rowGroup().enabled()) {
      const [rowGroupSort,] = this.dt.order();
      this.dt.order([rowGroupSort, userSort]).draw();
    } else {
      this.dt.order([userSort]).draw();
    }
  }

  search({ filters, searchVal, tsSearchResults }: SearchParams) {
    // console.log(`searching ${(<HTMLElement>this.element.closest('[data-resource-name]')!).dataset.resourceName} table for:`, { filters, searchVal, tsSearchResults });

    let dtSearch = this.dt.search('')
    dtSearch.columns().search('') 

    filters.forEach(({ column, q, regEx: isRegEx, smartSearch: useSmartSearch }) => {
      dtSearch = dtSearch.column(`${column}:name`).search(q, isRegEx, useSmartSearch);
    });
    
    // As the user types, search the table for the found options in the select box
    // => this ensures the datatables search matches the tomselect search
    if (tsSearchResults) {
      // TODO This does not work because chaining column searches performs a combinatorial search
      // => custom filter? check the search plug-in api
      // Object.keys(tsSearchResults).forEach(column => {
      //   dtSearch = dtSearch.column(`${column}:name`).search(`^(${tsSearchResults[column]})$`, true, false);
      // });
    } else if (searchVal) {
      const [column, id] = searchVal.split('-');
      dtSearch = dtSearch.column(`${column}:name`).search(`^${id}$`, true, false);
    }
    dtSearch.draw();
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