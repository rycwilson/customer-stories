import { Controller } from '@hotwired/stimulus';
import { debounce } from '../utils';
import type CustomerWinsController from './customer_wins_controller';
import type ContributionsController from './contributions_controller';
import type PromotedStoriesController from './promoted_stories_controller';
import DataTable from 'datatables.net-bs';
import type { Api, Config } from 'datatables.net-bs';
import 'datatables.net-rowgroup-bs';

interface SearchParams {
  filters: { column: string, q: string, regEx: boolean, smartSearch: boolean }[],
  searchSelectResults?: { [column: string]: string },
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
    searchParams: { type: Object, default: undefined },
    rowGroupEnabled: { type: Boolean, default: true },
    rowGroupDataSource: String,
    reload: { type: String, default: undefined },
    redraw: { type: Boolean, default: undefined },
    page: { type: Number, default: undefined },
    rowLookup: { type: Object, default: undefined }
  };
  declare initValue: boolean;
  declare searchParamsValue: SearchParams;
  declare rowGroupDataSourceValue: string;
  declare rowGroupEnabledValue: boolean;
  declare reloadValue: string;
  declare redrawValue: boolean;
  declare pageValue: number;
  declare rowLookupValue: { id?: number, position?: number };

  declare dt: Api<any>;
  declare searchDebounceTimer: number;

  // NOTE: This may trigger multiple times, presumably due to datatables manipulation
  // connect() {
  // }

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
        debounce(ctrl.clonePaginationComponents.bind(ctrl), 75)();
        ctrl.dispatch('drawn');
      },
      initComplete(this: any, settings: object) {
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

  searchParamsValueChanged(params: SearchParams) {
    // console.log(this.resourceOutlet.identifier, params)
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = window.setTimeout(() => this.search(params), 200);
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
    // this.dt.draw();
  }

  reloadValueChanged(resourceName: ResourceName) {
    if (!resourceName) return;
    
    const data = CSP[resourceName];
    this.dt.clear().rows.add(data); //.draw();
    this.reloadValue = '';
  }

  redrawValueChanged(shouldRedraw: boolean) {
    if (this.dt && shouldRedraw) {
      this.dt.draw(false); // false => hold current paging
    }
    this.redrawValue = false;
  }

  pageValueChanged(page: number) {
    if (!this.dt || Number.isNaN(page) || page < 0) return;

    this.dt.page(page).draw(false);
    this.element.removeAttribute('data-datatable-page-value');
  }

  rowGroupEnabledValueChanged(shouldEnable: boolean) {
    if (!this.dt) return;

    if (shouldEnable && this.rowGroupColumnIndex !== undefined) {
      this.dt.rowGroup().enable();
    } else {
      this.dt.rowGroup().disable();
    }
    // NOTE: do not draw here
  }

  // We want to preserve row group sorting (if present) when the user sorts a column.
  // Intercept th clicks and manually execute the sort.
  handleColumnSort = this.onColumnSort.bind(this);
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

  search({ filters, searchVal, searchSelectResults }: SearchParams) {
    // console.log(`searching ${(<HTMLElement>this.element.closest('[data-resource-name]')!).dataset.resourceName} table for:`, { filters, searchVal, searchSelectResults });

    let dtSearch = this.dt.search('')
    dtSearch.columns().search('') 

    filters.forEach(({ column, q, regEx: isRegEx, smartSearch: useSmartSearch }) => {
      dtSearch = dtSearch.column(`${column}:name`).search(q, isRegEx, useSmartSearch);
    });
    
    if (searchVal) {
      const [column, id] = searchVal.split('-');
      dtSearch = dtSearch.column(`${column}:name`).search(`^${id}$`, true, false);
    
    // As the user types, search the table for the found options in the select box
    // => this ensures the datatables search matches the tomselect search
    } else if (searchSelectResults) {
      // TODO This does not work because chaining column searches performs a combinatorial search
      // => custom filter? check the search plug-in api
      // Object.keys(searchSelectResults).forEach(column => {
      //   dtSearch = dtSearch.column(`${column}:name`).search(`^(${searchSelectResults[column]})$`, true, false);
      // });
    }
    dtSearch.draw();
  }

  clonePaginationComponents() {
    const info = this.element.parentElement?.querySelector(':scope > .dataTables_info');
    const paginate = this.element.parentElement?.querySelector(':scope > .dataTables_paginate');
    if (info instanceof HTMLElement) {
      const infoClone = info.cloneNode() as HTMLElement;
      infoClone.id = `${info.id}--clone`;
      infoClone.textContent = (
        info.textContent?.match(/(?<entries>\d+ to \d+ of \d+)/)?.groups?.entries || null
      );
      this.dispatch(
        'info-cloned',
        { detail: { clone: infoClone, pageInfo: this.dt.page.info() } }
      );
    }
    if (paginate instanceof HTMLElement) {
      const paginateClone = paginate.cloneNode(true) as HTMLElement;
      paginateClone.id = `${paginate.id}--clone`;
      const prevBtn = <HTMLAnchorElement>paginate.querySelector('.paginate_button.previous > a');
      const prevBtnClone = <HTMLAnchorElement>paginateClone.querySelector('.paginate_button.previous > a');
      prevBtnClone.href = "javascript:;"
      const nextBtn = <HTMLAnchorElement>paginate.querySelector('.paginate_button.next > a');
      const nextBtnClone = <HTMLAnchorElement>paginateClone.querySelector('.paginate_button.next > a');
      nextBtnClone.href = "javascript:;"
      const pageBtnClones = [...paginateClone.querySelectorAll('.paginate_button > a')]
        .filter(btn => btn !== prevBtnClone && btn !== nextBtnClone);
      prevBtnClone.innerHTML = '<i class="fa fa-chevron-left"></i>';
      nextBtnClone.innerHTML = '<i class="fa fa-chevron-right"></i>';
      pageBtnClones.forEach(btn => btn.remove());
      prevBtnClone.addEventListener('click', (e) => prevBtn.click());
      nextBtnClone.addEventListener('click', (e) => nextBtn.click());
      this.dispatch('paginate-cloned', { detail: { clone: paginateClone } });
    }
  }

  rowLookupValueChanged({ id, position }: { id?: number, position?: number }) {
    const rows = this.dt.rows({ search: 'applied' });
    const data = rows.data().toArray();
    const index = id ? data.findIndex(row => row.id === id) : (position ? position - 1 : -1);
    if (index === -1) return;

    const rowView = {
      page: Math.floor(index / this.dt.page.len()), 
      position: position || index + 1,
      turboFrame: { 
        id: `edit-${this.resourceOutlet.identifier.slice(0, -1)}`,
        src: data[index].edit_path 
      },
      actionsDropdownHtml: data[index].actionsDropdownHtml
    };
    this.dispatch('row-lookup', { detail: rowView });
  }
}