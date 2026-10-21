import type { Api, Config } from 'datatables.net';
import DataTable from 'datatables.net-bs';
import 'datatables.net-rowgroup-bs';
import { debounce } from '../utils';
// import { baseConfig, deleteRow } from '../tables';

export interface SearchObject { 
  column: string, 
  q: string,
  regEx: boolean,
  smartSearch: boolean 
}

export interface SearchParams {
  filters: SearchObject[],
  searchSelectResults?: { [column: string]: string },
  searchVal?: string
}

export class DataTableWrapper {
  debouncedSearch = debounce(this.search.bind(this), 200);
  private table: HTMLTableElement;
  private dt: Api<any>;
  private onColumnSort = this.handleColumnSort.bind(this);
  private debouncedCloneTableComponents = debounce(this.cloneTableComponents, 100);
  
  constructor(element: HTMLTableElement, config: Config) {
    this.table = element;
    this.dt = new DataTable(element, { ...this.baseConfig, ...config });
  }

  reload(data: any) {
    this.dt.clear().rows.add(data);
  }

  redraw(fullReset: boolean) {
    this.dt.draw(fullReset);
  }

  turnToPage(page: number) {
    this.dt.page(page).draw(false);
  }

  toggleRowGroup(shouldEnable: boolean) {
    if (shouldEnable) {
      this.dt.rowGroup().enable();
    } else {
      this.dt.rowGroup().disable();
    }
    // NOTE: do not draw here
  }

  row(tr: HTMLTableRowElement) {
    return this.dt.row(tr);
  }

  pageLength(newLength?: number): number | Api<any> {
    return newLength ? this.dt.page.len(newLength) : this.dt.page.len();
  }

  get currentRows() {
    return this.dt.rows({ search: 'applied' });
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

  handleRowGroupColumnChanged(column: number, prevColumn: number) {
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

  private get baseConfig() {
    return {
      deferRender: true,
      autoWidth: false,
      dom: 'tip',
      pageLength: 20,
      drawCallback: (_settings: object) => this.handleDrawn(_settings),
      initComplete: (_settings: object) => {
        this.table.dispatchEvent(new CustomEvent('datatable-init-complete'));
      }
    }
  }

  private handleDrawn(_settings: object) {
    this.toggleColumnSortListeners();
    this.debouncedCloneTableComponents();
    this.table.dispatchEvent(new CustomEvent('datatable-drawn'));
  }

  private toggleColumnSortListeners() {
    this.table.querySelectorAll('th.sorting').forEach(th => {
      th.removeEventListener('click', this.onColumnSort, true);
      th.addEventListener('click', this.onColumnSort, true);
    });
  }

  // We want to preserve row group sorting (if present) when the user sorts a column.
  // Intercept th clicks and manually execute the sort.
  private handleColumnSort(e: Event) {
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

  private cloneTableComponents() {
    const info = this.table.parentElement?.querySelector(':scope > .dataTables_info');
    const paginate = this.table.parentElement?.querySelector(':scope > .dataTables_paginate');
    if (info instanceof HTMLElement) {
      const infoClone = info.cloneNode() as HTMLElement;
      infoClone.id = `${info.id}--clone`;
      infoClone.textContent = (
        info.textContent?.match(/(?<entries>\d+ to \d+ of \d+)/)?.groups?.entries ?? null
      );
      this.table.dispatchEvent(new CustomEvent(
        'datatable-info-cloned',
        { detail: { clone: infoClone, pageInfo: this.dt.page.info() } }
      ));
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
      prevBtnClone.addEventListener('click', (_e) => prevBtn.click());
      nextBtnClone.addEventListener('click', (_e) => nextBtn.click());
      this.table.dispatchEvent(new CustomEvent(
        'datatable-paginate-cloned',
        { detail: { clone: paginateClone } }
      ));
    }
  }
}