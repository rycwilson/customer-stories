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
    resourceCtrlId: String
  };
  
  // static targets = ['row'];   // rowTargets exclude row groups
  // declare readonly rowTargets: HTMLTableRowElement[];

  declare dt: Api<any>;
  private declare readonly initValue: boolean;
  private declare readonly searchParamsValue: SearchParams;
  private declare readonly rowGroupEnabledValue: boolean;
  private declare readonly rowGroupColumnValue: number;
  private declare reloadValue: string;
  private declare redrawValue: boolean;
  private declare readonly pageValue: number;
  private declare readonly rowLookupValue: { id?: number, position?: number };
  private declare readonly resourceCtrlIdValue: string;

  declare searchDebounceTimer: number;

  // NOTE: This may trigger multiple times, presumably due to datatables DOM manipulation
  // connect() {
  // }

  initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;

    this.dispatch('ready', {  detail: { construct: this.construct.bind(this) } })
  }

  construct(config: Config) {
    this.dt = new DataTable(this.element, { ...baseConfig.bind(this)(), ...config });
  }

  searchParamsValueChanged(params: SearchParams) {
    // console.log(this.resourceCtrlIdValue, params)
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = window.setTimeout(() => this.search(params), 200);
  }

  rowGroupColumnValueChanged(column: number, prevColumn: number) {
    if (this.resourceCtrlIdValue === 'customer-wins') console.log(column, prevColumn)
    if (!this.dt) return;

    // Get either the only current sort (row groups disabled), 
    // or the current secondary sort (row groups enabled)
    const [sortColumnIndex, sortDirection] = this.dt.order().pop() as [number, 'asc' | 'desc'];

    if (column) {
      const src = this.dt.column(column).dataSrc();
      if (src instanceof Object && '_' in src) {
        this.dt.rowGroup().dataSrc(src['_']);
      } else {
        console.error('Expected orthogonal data for row group change')
        return;
      }
      this.dt.rowGroup().enable();
      this.dt.order([
        [column, sortColumnIndex === column ? sortDirection : 'asc'], 
        [sortColumnIndex, sortDirection]
      ]);
      this.dt.column(column).visible(false, false);
    } else {
      this.dt.rowGroup().disable();
      this.dt.order([[sortColumnIndex, sortDirection]]); // current sort
    }
    if (prevColumn) this.dt.column(prevColumn).visible(true, false);
    // this.dt.draw();
  }

  reloadValueChanged(resourceName: ResourceName) {
    if (this.dt && resourceName) {
      const data = CSP[resourceName];
      this.dt.clear().rows.add(data);
    }
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

    if (shouldEnable && this.rowGroupColumnValue) {
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

  deleteRow(
    { detail: { tr, path, storyId } }: 
    { detail: { tr: HTMLTableRowElement, path: string, storyId?: number } }
  ) {
    deleteRow.call(this, tr, path)
      .then(id => this.dispatch('row-deleted', { detail: { id, storyId } }));
  }

  clonePaginationComponents() {
    const info = this.element.parentElement?.querySelector(':scope > .dataTables_info');
    const paginate = this.element.parentElement?.querySelector(':scope > .dataTables_paginate');
    if (info instanceof HTMLElement) {
      const infoClone = info.cloneNode() as HTMLElement;
      infoClone.id = `${info.id}--clone`;
      infoClone.textContent = (
        info.textContent?.match(/(?<entries>\d+ to \d+ of \d+)/)?.groups?.entries ?? null
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

    // NOTE: The tr element for the row may not be currently displayed,
    // thus there is no access to the row controller and rowData
    const rowView = {
      page: Math.floor(index / this.dt.page.len()), 
      position: position || index + 1,
      turboFrame: { 
        id: `edit-${this.resourceCtrlIdValue.slice(0, -1)}`,
        src: data[index].edit_path 
      },
      actionsDropdownHtml: data[index].actions_dropdown_html
    };
    this.dispatch('row-lookup', { detail: rowView });
  }
}