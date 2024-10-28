import { kebabize } from './utils';
import type ResourceController from './controllers/resource_controller';
import { type Api as DataTableApi } from 'datatables.net-bs';

export function init(this: ResourceController) {
  this.datatableTarget.setAttribute('data-datatable-ready-value', 'true');
}

export function initComplete(this: ResourceController, dt: DataTableApi<any>) {
  const dispatchReadyEvent = () => this.dispatch('ready', { detail: { resourceName: this.resourceName } });
  this.dt = dt;
  if (this.resourceName === 'storyContributions') {
    dispatchReadyEvent();
  } else {
    initDisplayOptions.call(this);
    window.setTimeout(() => {
      this.dt.one('draw', dispatchReadyEvent);
      // console.log('searching table', this.resourceName)
      search.call(this);
    });
  }
}

export function toggleRowGroups(this: ResourceController, shouldEnable: boolean) {
  this.datatableTarget.setAttribute('data-datatable-enable-row-groups-value', shouldEnable.toString());
}

export function search(this: ResourceController, e?: CustomEvent) {
  const { 
    type: eventType, 
    detail: { searchResults: tsSearchResults } 
  } : {
    type: string, 
    detail: { searchResults?: object[] }
  } = e || { type: '', detail: {} };
  const isCuratorChange = eventType.includes('change-curator');
  const isFilterChange = eventType.includes('change-filter');
  const columnFilters = Object.entries(this.checkboxFiltersValue)
    .filter(([filterId, filter]) => !filter.checked)
    .map(([filterId, filter]) => {
      switch (filterId) {
        case 'show-wins-with-story':
          return { column: 'story', q: '^false$', regEx: true, smartSearch: false };
        case 'show-completed':
          return { column: 'status', q: '^((?!completed).)*$', regEx: true, smartSearch: false };
        case 'show-published':
          return { column: 'storyPublished', q: 'false', regEx: false, smartSearch: false };
        default: 
          throw new Error('Unrecognized column filter');        
      }
    });

  // sync curator and filter selections, but not search text input
  if (this.hasResourceOutlet) {
    if (isCuratorChange) {
      this.resourceOutlets.forEach(ctrl => {
        ctrl.curatorSelectTarget.tomselect.setValue(this.curatorSelectTarget.value, true);
      })
    }
    if (isFilterChange) {
      this.resourceOutlets.forEach(ctrl => {
        ctrl.filterSelectTarget.tomselect.setValue(this.filterSelectTarget.value, true);
      })
    }
    if (isCuratorChange || isFilterChange) {
      // wait for the visible table to be drawn before searching the sync'ed table
      this.element.addEventListener('datatable:drawn', () => {
        this.resourceOutlets.forEach(ctrl => {
          if (ctrl['dt']) setTimeout(() => search.call(ctrl))    // dt exists if the table has loaded
        });
      }, { once: true });
    }
  } 

  // console.log('searching...', JSON.stringify({
  //   ...{ curatorId: resourceCtrl.curatorSelectTarget.value },
  //   ...{ columnFilters },
  //   ...tsSearchResults ? { tsSearchResults } : { filterVal: resourceCtrl.filterSelectTarget.value }
  // }))

  this.datatableTarget.setAttribute(
    'data-datatable-search-params-value', 
    JSON.stringify({
      ...{ curatorId: this.curatorSelectTarget.value },
      ...{ columnFilters },
      ...tsSearchResults ? { tsSearchResults } : { filterVal: this.filterSelectTarget.value }
    })
  );
}

export function initDisplayOptions(this: ResourceController, isReset?: boolean) {
  const btn = this.tableDisplayOptionsBtnTarget;
  const resourceIdentifier = this.resourceName === 'customerWins' ? 'customer-wins' : 'contributors';
  const groupByResourceName = this.resourceName === 'customerWins' ? 'Customer' : 'Customer Win';
  const enableRowGroups = this.datatableTarget.getAttribute('data-datatable-enable-row-groups-value') === 'true';
  const content = displayOptionsPopoverContent(groupByResourceName, enableRowGroups, this.checkboxFiltersValue);
  if (isReset) $(btn).data()['bs.popover'].options.content = content;
  else $(btn).popover({
    content,
    html: true,
    animation: false,
    container: 'body',
    title: 'Display Options',
    placement: 'auto right',
    template: `
      <div 
        class="popover" 
        data-controller="table-display-options" 
        data-table-display-options-dashboard-outlet=".dashboard"
        data-table-display-options-resource-outlet="#${resourceIdentifier}"
        role="tooltip">
      
        <div class="arrow"></div>
        <h3 class="popover-title label-secondary"></h3>
        <div class="popover-content">
          <!-- the template below goes here -->
        </div>
      </div>
    `,
  });
}

function displayOptionsPopoverContent(groupByResourceName: string, enableRowGroups: boolean, checkboxFilters: object) {
  return `
    <div class="form-horizontal">
      <div class="form-group">
        <label class="col-sm-3 control-label">Group</label>
        <div class="col-sm-9">
          <div class="checkbox">
            <label for="group-by-${kebabize(groupByResourceName)}">
              <input 
                id="group-by-${kebabize(groupByResourceName)}" 
                type="checkbox" 
                data-action="table-display-options#toggleRowGroups"
                ${enableRowGroups ? 'checked' : ''}
                ${groupByResourceName === 'Customer Win' ? 'disabled' : ''}>
              <span>&nbsp;&nbsp;by ${groupByResourceName}</span>
            </label>
          </div>
        </div>
      </div>
      ${Object.entries(checkboxFilters).map(([filterId, filter], i) => (`
        <div class="form-group">
          <label class="col-sm-3 control-label">${i === 0 ? 'Show' : ''}</label>
          <div class="col-sm-9">
            <div class="checkbox">
              <label for="${filterId}">
                <input 
                  type="checkbox" 
                  id="${filterId}" 
                  data-action="table-display-options#toggleFilter"
                  ${filter.checked ? 'checked' : ''}>
                <span>&nbsp;&nbsp;${filter.label}</span>
              </label>
            </div>
          </div>
        </div>
      `)).join('')}
    </div>
  `;
}