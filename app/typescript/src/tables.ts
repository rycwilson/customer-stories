// import { kebabize } from './utils';
import type ResourceController from './controllers/resource_controller';
// import { type Api as DataTableApi } from 'datatables.net-bs';

export function init(this: ResourceController) {
  if (!this.hasDatatableTarget) return;

  this.datatableTarget.setAttribute('data-datatable-init-value', 'true');
}

export function onInitialized(this: ResourceController, e: CustomEvent) {
  if (this.identifier === 'customer-wins') {
    (window as any).dt = e.detail.dt; 
  }
  setTimeout(() => {
    e.detail.dt.one('draw', () => {
      this.dispatch('ready', { detail: { resourceName: this.resourceName } })
    });
    this.searchTable();
  });
}

export function search(this: ResourceController, searchSelectResults?: { [key: string]: string }) {
  if (!this.hasDatatableTarget) return;

  // console.log(this.resourceName + ' filtersValue:', this.filtersValue)
  this.datatableTarget.setAttribute(
    'data-datatable-search-params-value', 
    JSON.stringify({
      ...{ filters: (this as ResourceControllerWithDatatable).filtersToSearchObjects },
      ...(
        searchSelectResults ? 
          { searchSelectResults } :
          { searchVal: this.searchSelectTarget.value }
      )
    })
  );
}

export function addRow(this: ResourceController, data: CustomerWin | Contribution, draw = false) {
  if (!this.hasDatatableTarget) return;

  CSP[this.resourceName].push(data);
  this.datatableTarget.setAttribute('data-datatable-reload-value', this.resourceName);
  if (draw) { 
    this.datatableTarget.setAttribute('data-datatable-redraw-value', 'true'); 
  }
}

export function showRow(this: ResourceController, id: number) {
  if (!this.hasDatatableTarget) return;

  const columnName = (() => {
    switch (this.resourceName) {
      case 'customerWins': return 'success';
      case 'contributions': return 'contribution';
      default: return undefined;
    }
  })();
  if (!columnName) throw new Error('Unrecognized resource name for new record handling.');

  this.element.addEventListener(
    'datatable:drawn', 
    () => {
      setTimeout(() => {
        this.element.classList.add('has-open-row');
        const toggleChildBtn = <HTMLButtonElement>this.element.querySelector(
        `tr[data-customer-win-row-data-value*='"id":${id}'] td.toggle-child button`
        );
        toggleChildBtn.click();
      });
    },
    { once: true }
  );

  this.searchSelectTarget.tomselect.clear(true);
  this.datatableTarget.setAttribute('data-datatable-row-group-data-source-value', '');
  this.filtersValue = { ...this.filtersValue, [columnName]: id };
}

export function initDisplayOptions(this: ResourceController, isReset = false) {
  const btn = this.displayOptionsBtnTarget;
  if (isReset) {
    $(btn).data()['bs.popover'].options.content = this.displayOptionsHtmlValue;
  } else {
    $(btn).popover({
      content: this.displayOptionsHtmlValue,
      html: true,
      animation: false,
      container: 'body',
      viewport: { selector: 'body', padding: 70 },
      title: 'Display Preferences',
      placement: 'auto left',
      template: `
        <div
          class="popover ${this.identifier}" 
          data-controller="table-display-options" 
          data-table-display-options-${this.identifier}-outlet="#${this.identifier}"
          data-table-display-options-dashboard-outlet=".dashboard"
          role="tooltip">
          <div class="arrow"></div>
          <div class="popover-title__wrapper">
            <h3 class="popover-title label-secondary"></h3>
            <button type="button" class="close" data-action="table-display-options#hide" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="popover-content">
            <!-- content goes here (setting above) -->
          </div>
        </div>
      `,
    });
  }
}