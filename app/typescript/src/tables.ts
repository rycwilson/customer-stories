// import { kebabize } from './utils';
import type ResourceController from './controllers/resource_controller';
// import { type Api as DataTableApi } from 'datatables.net-bs';

export function init(this: ResourceController) {
  if (!this.hasDatatableTarget) return Promise.reject('No table found');

  return new Promise<void>((resolve: () => void) => {
    this.datatableTarget.addEventListener('datatable:init', resolve, { once: true });
    this.datatableTarget.setAttribute('data-datatable-init-value', 'true');
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
  return new Promise<void>((resolve: () => void) => {
    if (!draw) {
      resolve();
    } else {
      this.datatableTarget.addEventListener('datatable:drawn', resolve, { once: true });
      this.datatableTarget.setAttribute('data-datatable-redraw-value', 'true'); 
    }
  });
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