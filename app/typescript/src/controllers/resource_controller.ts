import type DashboardController from "./dashboard_controller";
import { Controller } from "@hotwired/stimulus";
import { getJSON } from '../utils';
import { 
  init as initTable,
  search as searchTable,
  getRowView,
  turnToPage,
  addRow as addTableRow,
  initDisplayOptions } from '../tables';

type ResourceFilters = (
  CustomerWinsFilters |
  ContributionsFilters |
  PromotedStoriesFilters |
  VisitorsFilters
);

type SearchObject = { column: string, q: string, regEx: boolean, smartSearch: boolean }

export default class ResourceController extends Controller<HTMLElement> {
  static outlets = ['dashboard'];
  declare readonly dashboardOutlet: DashboardController;

  static targets = [
    'searchSelect', 
    'displayOptionsBtn',
    'datatable',
    'tableNav',
    'rowView'
  ];
  declare readonly searchSelectTarget: TomSelectInput;
  declare readonly datatableTarget: HTMLDivElement;
  declare readonly hasDatatableTarget: boolean;
  declare readonly tableNavTarget: HTMLDivElement;
  declare readonly displayOptionsBtnTarget: HTMLButtonElement;
  declare readonly hasDisplayOptionsBtnTarget: boolean;
  declare readonly rowViewTarget: HTMLElement;

  static values = {
    init: { type: Boolean, default: false },
    dataPath: String,
    filters: { type: Object },
    displayOptionsHtml: String,
    rowId: { type: Number, default: undefined },
    newRow: { type: Object, default: undefined },
    rowView: { type: Object, default: undefined }
  }
  declare readonly initValue: boolean;
  declare readonly dataPathValue: string;
  declare filtersValue: ResourceFilters;
  declare readonly displayOptionsHtmlValue: string;
  declare rowIdValue: number;
  declare newRowValue: (
    { rowData: CustomerWinRowData | ContributionRowData, rowViewHtml: string } | undefined
  );
  declare rowViewValue: RowView;

  declare currentPage: number;

  get resourceName() {
    return this.element.dataset.resourceName as ResourceName;
  }
  
  get dataExists() {
    return false;
    // return this.resourceName === 'storyContributions' ?
    //   CSP[this.resourceName][+(this.element.dataset.storyId as string)] :
    //   CSP[this.resourceName];
  }
  
  get tableInitialized() {
    return this.hasDatatableTarget && $.fn.dataTable.isDataTable(this.datatableTarget);
  }

  get sharedSearchObjects(): SearchObject[] {
    const curatorId = this.filtersValue.curator;
    return [{ 
      column: 'curator',
      q: curatorId ? `^${curatorId}$` : '',
      regEx: true,
      smartSearch: false
    }];
  }

  connect() {
    if (this.hasDisplayOptionsBtnTarget) initDisplayOptions.call(this);
  }

  initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;
    
    const initialize = () => {
      initTable.call(this)
        .then(() => searchTable.call(this))
        .then(() => this.dispatch('ready', { detail: { resourceName: this.resourceName } }))
        .catch(err => console.error(`Error initializing ${this.resourceName} table:`, err));
    };
    const setAppData = (data: any) => {
      if (this.resourceName === 'storyContributions') {
        CSP[this.resourceName][+(this.element.dataset.storyId as string)] = data;
      } else {
        CSP[this.resourceName] = data;
      } 
    };
    if (this.dataExists) {
      initialize();
    } else {
      this.dispatch('loading');
      getJSON(this.dataPathValue).then(data => {
        setAppData(data);
        initialize();
      })
    }
  }

  onTomselectSearch(e: CustomEvent) {
    if (this.hasDatatableTarget) {
      searchTable.call(this, e.detail.searchSelectResults);
    }
  }

  onChangeSearchSelect(e: CustomEvent) {
    // this.addSyncListener((ctrl) => ctrl.searchSelectTarget.tomselect.setValue(this.searchSelectTarget.value));
    if (this.hasDatatableTarget) {
      searchTable.call(this);
    }
  }

  rowGroupDataSourceValueChanged(source: string) {
    // Both will be ignored by the datatables controller if the table is not yet initialized
    this.datatableTarget.setAttribute('data-datatable-row-group-data-source-value', source);
    this.datatableTarget.setAttribute('data-datatable-redraw-value', 'true');
  }
  
  filtersValueChanged(newFilters: ResourceFilters, oldFilters: ResourceFilters) {
    // if (this.identifier === 'customer-wins') {
      // console.log(`old ${this.identifier} filtersValue:`, oldFilters)
      // console.log(`new ${this.identifier} filtersValue:`, newFilters)
    // }
    if (this.tableInitialized) {
      searchTable.call(this);
    }
  }

  backToTable() {
    this.rowViewValue = { position: 0 };
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
      if (page !== this.currentPage) await turnToPage.call(this, page);
      this.rowViewValue = rowView;
    }
    getRowView.call(this, { id: newId })
      .then(showView)
      .catch(err => { console.error('Error showing row view by id:', err); });
  }
  
  newRowValueChanged(
    { rowData, rowViewHtml } :
    { rowData: CustomerWinRowData | ContributionRowData, rowViewHtml: string }
  ) {
    const getView = () => getRowView.call(this, { id: rowData.id });
    const showView = async (rowView: RowView) => {
      const page = <number>rowView.page;
      if (page !== this.currentPage) await turnToPage.call(this, page);
      this.rowViewValue = { position: rowView.position, html: rowViewHtml };
    }
    addTableRow.call(this, rowData, true)
      .then(getView)
      .then(showView)
      .catch(err => { console.error('Error showing new row view:', err); });
  }

  openRowView(e: CustomEvent) {
    const { detail: rowView }: { detail: RowView } = e;
    this.rowViewValue = rowView;
  }
  
  stepRowView(e: CustomEvent) {
    let { detail: { position, newPage } } = e;
    const showView = async (rowView: RowView) => {
      if (typeof newPage === 'number') await turnToPage.call(this, newPage);
      this.rowViewValue = rowView;
    };
    getRowView.call(this, { position })
      .then(showView)
      .catch(err => { console.error('Error stepping row view:', err); });
  }
  
  validateNewItem(e: Event) {
    const btn = <HTMLButtonElement>e.currentTarget;
    if (this.filtersValue.curator && this.filtersValue.curator !== CSP.currentUser!.id) {
      const label = btn?.ariaLabel?.match(/^New (?<label>.+)$/)?.groups?.label;
      const mesg = `Can't add a new ${label || 'item'} when Curator preference is set to another user`;
      e.preventDefault();
      e.stopImmediatePropagation();
      this.element.dispatchEvent(
        new CustomEvent('toast', { detail: { errors: [mesg] }, bubbles: true })
      );
    }
  }

  onTableInfoCloned(this: ResourceControllerWithDatatable, e: CustomEvent) {
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

  onTablePaginateCloned(this: ResourceControllerWithDatatable, e: CustomEvent) {
    const { clone } = e.detail;
    this.tableNavOutlet.paginateTarget.replaceChildren(clone);
  }

  onRowDeleted({ detail: { id, storyId } }: { detail: { id: number, storyId?: number } }) {
    CSP[this.resourceName] = CSP[this.resourceName].filter(
      (item: CustomerWin | Contribution) => item.id !== id
    );
    if (storyId && this.resourceName === 'contributions') {
      CSP.storyContributions[storyId] = CSP.storyContributions[storyId].filter(
        (contribution: Contribution) => contribution.id !== id
      );
    }
  }

  // addSyncListener(syncResource: (ctrl: ResourceController) => void) {
  //   this.element.addEventListener('datatable:drawn', () => {
  //     this.resourceOutlets.forEach(ctrl => {
  //       // console.log('syncing:', ctrl.resourceName);
  //       if (ctrl['dt']) setTimeout(() => syncResource(ctrl));   // dt exists if the table has loaded
  //     });
  //   }, { once: true });
  // }
}