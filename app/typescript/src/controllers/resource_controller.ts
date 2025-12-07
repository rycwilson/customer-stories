import type DashboardController from "./dashboard_controller";
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
  declare rowViewValue: { 
    position: number;
    turboFrame?: { id: string, src: string };
    html?: string;
  };

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

  backToTable() {
    this.rowViewValue = { position: 0 };
  }

  rowViewValueChanged(
    { position, turboFrame, html }: 
    { position: number, turboFrame?: { id: string, src: string }, html?: string }
  ) {
    if (position === 0) {
      this.tableNavTarget.setAttribute('data-table-nav-row-position-value', '');
      this.element.classList.remove('row-view-shown');
    } else {
      this.tableNavTarget.setAttribute('data-table-nav-row-position-value', position.toString());
      this.element.classList.add('row-view-shown');
      if (html) {
        this.rowViewTarget.innerHTML = html;
        this.rowViewTarget.classList.add('ready');
      } else if (turboFrame) {
        const spinnerTimer = setTimeout(() => this.rowViewTarget.classList.add('loading'), 1000);
        this.rowViewTarget.addEventListener(
          'turbo:frame-render',
          (e: Event) => {
            this.rowViewTarget.classList.add('ready');
            clearTimeout(spinnerTimer);
            this.rowViewTarget.classList.remove('loading');
          },
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
          <turbo-frame id="${turboFrame.id}" src="${turboFrame.src}"></turbo-frame>
        `
      }
    }
  }

  rowIdValueChanged(newId: number, oldId: number) {
    if (!newId || newId === oldId) return;

    const onLookupResponse = (e: Event) => {
      const { detail: { position, turboFrame } } = e as CustomEvent;
      this.rowIdValue = 0;
      this.rowViewValue = { position, turboFrame };
    }
    this.element.addEventListener('datatable:row-lookup', onLookupResponse, { once: true });
    this.datatableTarget
      .setAttribute('data-datatable-row-lookup-value', JSON.stringify({ id: newId }));
  }
  
  newRowValueChanged(
    { rowData, rowViewHtml } :
    { rowData: CustomerWinRowData | ContributionRowData, rowViewHtml: string }
  ) {
    this.addTableRow(rowData, true);
    const onLookupResponse = (e: Event) => {
      const { detail: { position } } = e as CustomEvent;
      this.rowViewValue = { position, html: rowViewHtml };
    }

    // Wait for table to draw after adding row
    setTimeout(() => {
      this.element.addEventListener('datatable:row-lookup', onLookupResponse, { once: true });
      this.datatableTarget
        .setAttribute('data-datatable-row-lookup-value', JSON.stringify({ id: rowData.id }));
    })
  }

  openRowView(e: CustomEvent) {
    const { detail: { position, turboFrame } } = e;
    this.rowViewValue = { position, turboFrame };
  }
  
  stepRowView(e: CustomEvent) {
    const { detail: { position } } = e;
    const onLookupResponse = (e: Event) => {
      const { detail: { turboFrame } } = e as CustomEvent;
      this.rowViewValue = { position, turboFrame };
    }
    this.element.addEventListener('datatable:row-lookup', onLookupResponse, { once: true });
    this.datatableTarget
      .setAttribute('data-datatable-row-lookup-value', JSON.stringify({ position }));
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

  // addSyncListener(syncResource: (ctrl: ResourceController) => void) {
  //   this.element.addEventListener('datatable:drawn', () => {
  //     this.resourceOutlets.forEach(ctrl => {
  //       // console.log('syncing:', ctrl.resourceName);
  //       if (ctrl['dt']) setTimeout(() => syncResource(ctrl));   // dt exists if the table has loaded
  //     });
  //   }, { once: true });
  // }
}