// import { kebabize } from './utils';
import type ResourceController from './controllers/resource_controller';
// import { type Api as DataTableApi } from 'datatables.net-bs';

export function init(this: ResourceController) {
  if (!this.hasDatatableTarget) return Promise.reject('No table found');

  const table = this.datatableTarget;
  return new Promise<void>((resolve: () => void) => {
    table.addEventListener('datatable:init', resolve, { once: true });
    table.setAttribute('data-datatable-init-value', 'true');
  });
}

export function search(this: ResourceController, searchSelectResults?: { [key: string]: string }) {
  if (!this.hasDatatableTarget) return Promise.reject('No table found');

  // console.log(this.resourceName + ' filtersValue:', this.filtersValue)
  const table = this.datatableTarget;
  return new Promise<void>((resolve: () => void) => {
    table.addEventListener('datatable:drawn', resolve, { once: true });
    table.setAttribute(
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
  });
}

export function getRowView(
  this: ResourceController, 
  { id, position }: { id?: number, position?: number }
) {
  if (!this.hasDatatableTarget) return Promise.reject('No table found');
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
      this.datatableTarget
        .setAttribute('data-datatable-row-lookup-value', JSON.stringify({ id, position }) );
    }
  );
}

export function turnToPage(this: ResourceController, page: number) {
  if (!this.hasDatatableTarget) return Promise.reject('No table found');

  const table = this.datatableTarget;
  return new Promise<void>(resolve => {
    table.addEventListener(
      'datatable:drawn',
      () => { this.currentPage = page; resolve(); }, { once: true }
    );
    table.setAttribute('data-datatable-page-value', page.toString());
  });
}

export function addRow(this: ResourceController, data: CustomerWin | Contribution, draw = false) {
  if (!this.hasDatatableTarget) return Promise.reject('No table found');

  const table = this.datatableTarget;
  CSP[this.resourceName].push(data);
  table.setAttribute('data-datatable-reload-value', this.resourceName);
  return new Promise<void>((resolve: () => void) => {
    if (!draw) {
      resolve();
    } else {
      table.addEventListener('datatable:drawn', resolve, { once: true });
      table.setAttribute('data-datatable-redraw-value', 'true'); 
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