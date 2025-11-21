import type DashboardController from "./dashboard_controller";
import type DatatableRowController from "./datatable_row_controller";
import { Controller } from "@hotwired/stimulus";
import { getJSON } from '../utils';
import { 
  init as initTable,
  onInitialized as onTableInitialized,
  search as searchTable,
  addRow as addTableRow,
  showRow as showTableRow,
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
    'rowPartial'
  ];
  declare readonly searchSelectTarget: TomSelectInput;
  declare readonly datatableTarget: HTMLDivElement;
  declare readonly hasDatatableTarget: boolean;
  declare readonly tableNavTarget: HTMLDivElement;
  declare readonly displayOptionsBtnTarget: HTMLButtonElement;
  declare readonly hasDisplayOptionsBtnTarget: boolean;
  declare readonly rowPartialTarget: HTMLElement;

  static values = {
    init: { type: Boolean, default: false },
    dataPath: String,
    filters: { type: Object },
    displayOptionsHtml: String,
    newRow: { type: Object, default: undefined },
  }
  declare readonly initValue: boolean;
  declare readonly dataPathValue: string;
  declare filtersValue: ResourceFilters;
  declare readonly displayOptionsHtmlValue: string;
  declare newRowValue: (
    { rowData: CustomerWinRowData | ContributionRowData, rowPartial: string } | undefined
  );

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

  initTable = initTable.bind(this);
  onTableInitialized = onTableInitialized.bind(this);
  searchTable = searchTable.bind(this);
  addTableRow = addTableRow.bind(this);
  showTableRow = showTableRow.bind(this);

  connect() {
    if (this.hasDisplayOptionsBtnTarget) initDisplayOptions.call(this);
  }

  openRowPartial(
    { detail: { position, turboFrame, ctrl } }: 
    { 
      detail: {
        position: number; 
        turboFrame?: { id: string, src: string } 
        ctrl?: DatatableRowController<any, any>, 
      } 
    }
  ) {
    const partialTemplate = ({ id, src }: { id: string, src: string }) => `
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
    const renderPartial = (turboFrame: { id: string, src: string }) => {
      const spinnerTimer = setTimeout(() => this.rowPartialTarget.classList.add('loading'), 1000);
      this.rowPartialTarget.addEventListener(
        'turbo:frame-render',
        (e: Event) => {
          this.rowPartialTarget.classList.add('ready');
          clearTimeout(spinnerTimer);
          this.rowPartialTarget.classList.remove('loading');
        },
        { once: true }
      );
      this.rowPartialTarget.innerHTML = partialTemplate(turboFrame);
    }
    this.tableNavTarget.setAttribute('data-table-nav-row-position-value', position.toString());
    this.element.classList.add('row-partial-open');
    if (turboFrame) {
      renderPartial(turboFrame);
    } else {
      this.element.addEventListener(
        'datatable:row-partial',
        (e: Event) => {
          const { detail: { turboFrame } } = e as CustomEvent;
          renderPartial(turboFrame);
        },
        { once: true }
      )
      this.datatableTarget.setAttribute(
        'data-datatable-row-partial-at-position-value',
        position.toString()
      );
    }
    
  }

  backToTable() {
    this.tableNavTarget.setAttribute('data-table-nav-row-position-value', '');
    this.element.classList.remove('row-partial-open');
  }

  initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;

    if (this.dataExists) {
      this.initTable();
    } else {
      this.dispatch('loading');
      getJSON(this.dataPathValue).then(data => {
        if (this.resourceName === 'storyContributions') {
          CSP[this.resourceName][+(this.element.dataset.storyId as string)] = data;
        } else {
          CSP[this.resourceName] = data;
        } 
        this.initTable();
      })
    }
  }

  onTomselectSearch(e: CustomEvent) {
    if (this.hasDatatableTarget) {
      this.searchTable(e.detail.searchSelectResults);
    }
  }

  onChangeSearchSelect(e: CustomEvent) {
    // this.addSyncListener((ctrl) => ctrl.searchSelectTarget.tomselect.setValue(this.searchSelectTarget.value));
    if (this.hasDatatableTarget) {
      this.searchTable();
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
      this.searchTable();
    }
  }

  newRowValueChanged(
    { rowData, rowPartial } :
    { rowData: CustomerWinRowData | ContributionRowData, rowPartial: string }
  ) {
    this.addTableRow(rowData, true);

    this.rowPartialTarget.innerHTML = rowPartial;
    this.element.classList.add('row-partial-open');
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

  // Pass the clone via an outlet since it is a complex object with attached event listeners,
  // thus can't be passed by data attribute
  onTableInfoCloned(this: ResourceControllerWithDatatable, e: CustomEvent) {
    const { clone } = e.detail;
    this.tableNavOutlet.infoTarget.replaceChildren(clone);
  }

  onTablePaginateCloned(this: ResourceControllerWithDatatable, e: CustomEvent) {
    const { clone } = e.detail;
    this.tableNavOutlet.paginateTarget.replaceChildren(clone);
  }

  // toPrevPartial({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
  //   const current = +this.infoTarget.innerText.match(/^(?<current>\d+)/)!.groups!.current;
  //   if (current === 1) {
  //     return;
  //   } else if (current === 2) {
  //     btn.style.cursor = 'not-allowed';
  //   }
  //   this.infoTarget.innerText = this.infoTarget.innerText
  //     .replace(/^(\d+)/, (match, n) => `${+n - 1}`); 
  // }

  // toNextPartial({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
  //   const current = +this.infoTarget.innerText.match(/^(?<current>\d+)/)!.groups!.current;
  //   const last = +this.infoTarget.innerText.match(/of (?<last>\d+)$/)!.groups!.last;
  //   if (current === last) {
  //     return;
  //   } else if (current === last - 1) {
  //     btn.style.cursor = 'not-allowed';
  //   }
  //   this.infoTarget.innerText = this.infoTarget.innerText
  //     .replace(/^(\d+)/, (match, n) => `${+n + 1}`);  
  // }

  // addSyncListener(syncResource: (ctrl: ResourceController) => void) {
  //   this.element.addEventListener('datatable:drawn', () => {
  //     this.resourceOutlets.forEach(ctrl => {
  //       // console.log('syncing:', ctrl.resourceName);
  //       if (ctrl['dt']) setTimeout(() => syncResource(ctrl));   // dt exists if the table has loaded
  //     });
  //   }, { once: true });
  // }
}