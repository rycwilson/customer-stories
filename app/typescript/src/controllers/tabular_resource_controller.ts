import ResourceController from './resource_controller';
import DataTable, { type Config } from 'datatables.net';
import { ResourceFilters, TabularResource } from '../lib';
import Cookies from 'js-cookie';

type RowView = {
  page?: number;
  position: number;
  turboFrame?: TurboFrameAttributes;
  html?: string;
  actionsDropdownHtml?: string;
}

export default class TabularResourceController extends ResourceController {
  static outlets = [...super.outlets, 'table-nav'];
  static values = {
    ...super.values,
    rowGroupColumn: { type: Number, default: undefined },
    rowId: { type: Number, default: undefined },
    newRow: { type: Object, default: undefined },
    rowView: { type: Object, default: undefined }
  }
  static targets = [...super.targets, 'table', 'tableNav', 'rowView'];

  declare newRowValue: { rowData: RowData, rowViewHtml: string } | undefined
  declare rowGroupColumnValue: number | undefined;
  
  protected declare resource: TabularResource;
  
  private declare readonly tableNavOutlet: import('.').TableNavController;
  private declare readonly tableTarget: HTMLTableElement;
  private declare readonly tableNavTarget: HTMLElement;
  private declare readonly rowViewTarget: HTMLElement;
  private declare readonly rowIdValue: number | undefined;
  private declare rowViewValue: RowView | undefined;
  private declare tableConfig: Config;
  private declare currentPage: number;

  get tableInitialized() {
    return DataTable.isDataTable(this.tableTarget);
  }

  async initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;

    // console.log(`Initializing TabularResourceController ${this.identifier}...`)
    this.dispatch('loading');
    const data = await this.resource.init(this.dataPathValue);
    this.setAppData(data);
    await this.initTable();
    await this.searchTable();
    this.dispatch('ready');
  }
  
  initTable() {
    const options = { rowGroupColumn: this.rowGroupColumnValue };
    const initialize = (resolve: VoidFunction, e: Event) => {
      const { construct } = (e as CustomEvent<{ construct: (config: Config) => void }>).detail;
      this.tableTarget.addEventListener('datatable-init-complete', resolve, { once: true })
      construct(this.resource.dataTableConfig(options));
    }
    return new Promise<void>(resolve => {
      this.tableTarget
        .addEventListener('datatable:ready', initialize.bind(this, resolve), { once: true });
      this.tableTarget.setAttribute('data-datatable-init-value', 'true');
    });
  }

  setPreferences() {
    if (!this.popover) return;

    super.setPreferences();
    const rowGroupInput = <HTMLInputElement>this.popover.querySelector(
      `[name="${this.identifier}-row-group-column"][value="${this.rowGroupColumnValue ?? ''}"]`
    );
    rowGroupInput.checked = true;
  }

  searchTable(searchSelectResults?: Record<string, string>) {
    return new Promise<void>((resolve: VoidFunction) => {
      this.tableTarget.addEventListener('datatable-drawn', resolve, { once: true });
      this.tableTarget.setAttribute(
        'data-datatable-search-params-value', 
        JSON.stringify({
          filters: this.resource.searchObjects(this.filtersValue),
          ...(
            searchSelectResults ? 
            { searchSelectResults } :
            { searchVal: this.searchSelectTarget.value }
          )
        })
      );
    });
  }

  filtersValueChanged(filters: ResourceFilters, prevFilters: ResourceFilters) {
    if (this.tableInitialized) {
      this.searchTable();
    }
  }

  backToTable() {
    this.rowViewValue = { position: 0 };
  }

  turnToTablePage(page: number) {
    return new Promise<void>(resolve => {
      this.tableTarget.addEventListener(
        'datatable-drawn',
        () => { this.currentPage = page; resolve(); }, 
        { once: true }
      );
      this.tableTarget.setAttribute('data-datatable-page-value', page.toString());
    });
  }

  handleTomselectSearched(e: CustomEvent) {
    this.searchTable(e.detail.searchSelectResults);
  }

  handleSearchSelectChanged() {
    this.searchTable();
  }
  
  handleRowGroupColumnChanged({ target }: { target: HTMLInputElement }) {
    this.rowGroupColumnValue = +target.value || undefined;
    Cookies.set(`${this.identifier}-row-group-column`, target.value);
  }

  addRow(data: SourceData, draw = false) {
    // console.log(`addRow(${JSON.stringify(data)}, ${draw})`);
    const table = this.tableTarget;
    CSP[this.resourceName].push(data);
    table.setAttribute('data-datatable-reload-value', this.resourceName);
    return new Promise<void>((resolve: () => void) => {
      if (!draw) {
        resolve();
      } else {
        table.addEventListener('datatable-drawn', resolve, { once: true });
        table.setAttribute('data-datatable-redraw-value', 'true'); 
      }
    });
  }

  getRowView({ id, position }: { id?: number, position?: number }) {
    if (!id && !position) return Promise.reject('Either id or position must be provided');
    
    return new Promise<RowView>(
      (resolve) => {
        this.element.addEventListener(
          'datatable:row-lookup',
          (e: Event) => {
            const { detail: rowView } = e as CustomEvent;
            resolve(rowView);
          },
          { once: true }
        );
        this.tableTarget
          .setAttribute('data-datatable-row-lookup-value', JSON.stringify({ id, position }) );
      }
    );
  }

  rowGroupColumnValueChanged(column: number | undefined) {
    if (column) {
      this.tableTarget.setAttribute('data-datatable-row-group-column-value', column.toString());
    } else { 
      this.tableTarget.removeAttribute('data-datatable-row-group-column-value')
    }
    this.tableTarget.setAttribute('data-datatable-redraw-value', 'true');
  }

  rowViewValueChanged(rowView: RowView) {
    const { position, turboFrame, html, actionsDropdownHtml } = rowView;
    this.element.classList.toggle('row-view-shown', position !== 0);
    this.tableNavTarget
      .setAttribute('data-table-nav-row-position-value', (position || '').toString());
    if (position) {
      this.renderRowView({ html, turboFrame }).then((timer: number) => {
        this.rowViewTarget.classList.add('ready');
        if (timer) clearTimeout(timer);
        this.rowViewTarget.classList.remove('loading');
        const actionsDropdownWrapper = 
          this.rowViewTarget.querySelector('[data-controller="dropdown"]');
        if (actionsDropdownWrapper && actionsDropdownHtml) {
          actionsDropdownWrapper.innerHTML = actionsDropdownHtml;
        }
      });
    }
  }

  renderRowView({ html, turboFrame }: { html?: string, turboFrame?: TurboFrameAttributes }) {
    return new Promise<number>(resolve => {
      if (html) {
        this.rowViewTarget.innerHTML = html;
        resolve(0);
      } else {
        const { id, src } = turboFrame!; // either html or turboFrame is provided
        const spinnerTimer = 
          window.setTimeout(() => this.rowViewTarget.classList.add('loading'), 1000);
        this.rowViewTarget.addEventListener(
          'turbo:frame-render', 
          () => resolve(spinnerTimer),
          { once: true }
        );
        this.rowViewTarget.innerHTML = `
          <div class="spinner">
            <div class="lds-ring">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
          <turbo-frame id="${id}" src="${src}"></turbo-frame>
        `;
      }
    });
  }

  rowIdValueChanged(newId: number, oldId: number) {
    if (!newId || newId === oldId) return;

    const showView = async (rowView: RowView) => {
      const page = <number>rowView.page;
      if (page !== this.currentPage) await this.turnToTablePage(page);
      this.rowViewValue = rowView;
    }
    this.getRowView({ id: newId })
      .then(showView)
      .catch(err => { console.error('Error showing row view by id:', err); });
  }
  
  newRowValueChanged({ rowData, rowViewHtml }: { rowData: RowData, rowViewHtml: string }) {
    const getView = () => this.getRowView({ id: rowData.id });
    const showView = async (rowView: RowView) => {
      const page = <number>rowView.page;
      if (page !== this.currentPage) await this.turnToTablePage(page);
      this.rowViewValue = { position: rowView.position, html: rowViewHtml };
    }
    this.addRow(rowData, true)
      .then(getView)
      .then(showView)
      .catch(err => { console.error('Error showing new row view:', err); });
  }

  openRowView(e: CustomEvent<{ rowView: RowView }>) {
    this.rowViewValue = e.detail.rowView;
  }
  
  stepRowView(e: CustomEvent) {
    const { detail: { position, newPage } } = e;
    const showView = async (rowView: RowView) => {
      if (typeof newPage === 'number') await this.turnToTablePage(newPage);
      this.rowViewValue = rowView;
    };
    this.getRowView({ position })
      .then(showView)
      .catch(err => { console.error('Error stepping row view:', err); });
  }

  handleRowDeleted({ detail: { id, storyId } }: CustomEvent<{ id: number, storyId?: number }>) {
    CSP[this.resourceName] = CSP[this.resourceName].filter(
      (item: SourceData) => item.id !== id
    );
    if (storyId && this.resourceName === 'contributions') {
      CSP.storyContributions[storyId] = CSP.storyContributions[storyId].filter(
        (contribution: import('../lib/').Contribution) => contribution.id !== id
      );
    }
  }

  handleTableInfoCloned(e: CustomEvent) {
    const { clone, pageInfo } = e.detail;
    
    // NOTE: The page end value from datatables is exclusive,
    // so it is the index of the last row on the page + 1.
    // => Transform this before passing to table nav controller
    this.tableNavTarget.setAttribute(
      'data-table-nav-page-info-value',
      JSON.stringify({ ...pageInfo, end: pageInfo.end - 1 })
    );
    this.currentPage = pageInfo.page;
    
    // Pass the clone via an outlet since it is a complex object with attached event listeners,
    // thus can't be passed by data attribute
    this.tableNavOutlet.infoTarget.replaceChildren(clone);
  }

  handleTablePaginateCloned(e: CustomEvent<{ clone: HTMLElement }>) {
    const { clone } = e.detail;
    this.tableNavOutlet.paginateTarget.replaceChildren(clone);
  }
}