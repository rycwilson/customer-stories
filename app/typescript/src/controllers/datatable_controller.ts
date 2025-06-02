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
        if (ctrl.didInitialize) ctrl.redrawRowGroups();
        ctrl.dispatch('drawn');
      },
      initComplete(this: any, settings: object) {
        ctrl.cloneFilterResults();
        ctrl.didInitialize = true;
        ctrl.dispatch('init', { detail: { dt: this.api() } });
      }
    }
  };

  readyValueChanged(dataIsReady: boolean) {
    if (dataIsReady) {
      this.dt = new DataTable(
        this.element, 
        { ...this.baseConfig, ...this.resourceOutlet.tableConfig }
      );
    }
  }

  searchParamsValueChanged(newVal: SearchParams, oldVal: SearchParams | undefined) {
    if (oldVal !== undefined) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = window.setTimeout(() => this.search(newVal), 200);
    }
  }

  search({ filters, searchVal, tsSearchResults }: SearchParams) {
    // console.log(`searching ${(<HTMLElement>this.element.closest('[data-resource-name]')!).dataset.resourceName} table for:`, { filters, searchVal, tsSearchResults });

    let dtSearch = this.dt.search('')
    dtSearch.columns().search('') 

    filters.forEach(({ column, q, regEx: isRegEx, smartSearch: useSmartSearch }) => {
      dtSearch = dtSearch.column(`${column}:name`).search(q, isRegEx, useSmartSearch);
    });
    
    // as the user types, search the table for the found options in the select box
    // => this ensures the datatables search matches the tomselect search
    if (tsSearchResults) {
      Object.keys(tsSearchResults).forEach(column => {
        dtSearch = dtSearch.column(`${column}:name`).search(`^(${tsSearchResults[column]})$`, true, false);
      });
    } else if (searchVal) {
      const [column, id] = searchVal.split('-');
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