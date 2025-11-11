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
  // didInitialize = false;
  declare searchDebounceTimer: number;
  
  get resourceOutlet(): CustomerWinsController | ContributionsController | PromotedStoriesController {
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
        // console.log('drawCallback', this[0].id)
        // if (ctrl.didInitialize) ctrl.redrawRowGroups();
        ctrl.dispatch('drawn');
      },
      initComplete(this: any, settings: object) {
        if (ctrl.resourceOutlet.identifier === 'customer-wins') {
          console.log('init complete')
        }
        ctrl.cloneFilterResults();
        // ctrl.didInitialize = true;
        this.api().on('order.dt', (e: any, settings: any) => {
          if (ctrl.resourceOutlet.identifier === 'customer-wins') {
            console.log('row groups:', this.api().rowGroup().enabled())
            console.log('order:', this.api().order())
          }
        });
        ctrl.dispatch('init', { detail: { dt: this.api() } });
      }
    }
  };

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

  rowGroupDataSourceValueChanged(newVal: string, oldVal: string | undefined) {
    if (oldVal === undefined) return; // skip on initial connect

    // NOTE: rowGroupDataSource needs to align with row data poperties
    // For looking up the column index, we must reference column names, not data properties,
    // and the customer win column is still named 'success' due to select options e.g. 'success-1'
    let columnName = newVal?.split('.')[0];
    if (columnName === 'customer_win') columnName = 'success';

    const columnNumber = columnName ?
      this.dt.columns(`${columnName}:name`).indexes()[0] :
      undefined;

    // Switch back
    if (columnName === 'success') columnName = 'customer_win';

    console.log('dt row group column:', columnNumber)

    // if (this.resourceOutlet.resourceName === 'customerWins') {
    //   if (shouldEnable) {
    //     this.dt.order([[2, 'asc'], [1, 'desc']]).draw(); // row group column asc, created at desc
    //   } else {
    //     this.dt.order([1, 'desc']).draw();
    //   }
    // } else {
    //   this.dt.draw();
    // }
  }

  redrawRowGroups() {
    // const rowGroups = this.dt.rowGroup();
    // const shouldEnable = this.enableRowGroupsValue;
    // const shouldRedraw = (!shouldEnable && rowGroups.enabled()) || (shouldEnable && !rowGroups.enabled());
    
    // // without a timeout, the row groups get duplicated
    // setTimeout(() => {
    //   if (shouldEnable && shouldRedraw) rowGroups.enable().draw();
    //   if (!shouldEnable && shouldRedraw) rowGroups.disable().draw();
    //   if (shouldRedraw) this.element.classList.toggle('has-row-groups');
    // })
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