import { kebabize } from './util';

export function init(resourceCtrl) {
  resourceCtrl.datatableTarget.setAttribute('data-datatable-ready-value', 'true');
}

export function initComplete(resourceCtrl, dt) {
  resourceCtrl.dt = dt;
  initDisplayOptions(resourceCtrl);
  search(resourceCtrl);
}

export function toggleRowGroups(resourceCtrl, shouldEnable) {
  resourceCtrl.datatableTarget.setAttribute('data-datatable-enable-row-groups-value', shouldEnable);
}

export function search(resourceCtrl, e = { type: '', detail: {} }, syncedResourceCtrl) {
  if (!resourceCtrl) return false;
  const isUserInput = e.type;
  const isCuratorChange = isUserInput && e.type.includes('change-curator');
  const isFilterChange = isUserInput && e.type.includes('change-filter');
  const shouldSyncTables = isCuratorChange || isFilterChange;
  const tsSearchResults = e.detail && e.detail.searchResults;
  const columnFilters = Object.entries(resourceCtrl.checkboxFiltersValue)
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
  if (isCuratorChange) {
    syncedResourceCtrl.curatorSelectTarget.tomselect.setValue(resourceCtrl.curatorSelectTarget.value, true);
  } else if (isFilterChange) {
    syncedResourceCtrl.filterSelectTarget.tomselect.setValue(resourceCtrl.filterSelectTarget.value, true);
  }
  
  // wait for the visible table to be drawn before searching the sync'ed table
  if (shouldSyncTables) {
    resourceCtrl.element.addEventListener('datatable:drawn', () => {
      setTimeout(() => search(syncedResourceCtrl));
    }, { once: true });
  }

  resourceCtrl.datatableTarget.setAttribute(
    'data-datatable-search-params-value', 
    JSON.stringify({
      ...{ curatorId: resourceCtrl.curatorSelectTarget.value },
      ...{ columnFilters },
      ...tsSearchResults ? { tsSearchResults } : { filterVal: resourceCtrl.filterSelectTarget.value }
    })
  );
}

export function initDisplayOptions(resourceCtrl, isReset = false) {
  const btn = resourceCtrl.tableDisplayOptionsBtnTarget;
  const resourceIdentifier = resourceCtrl.resourceName === 'customerWins' ? 'customer-wins' : 'contributors';
  const groupByResourceName = resourceCtrl.resourceName === 'customerWins' ? 'Customer' : 'Customer Win';
  const enableRowGroups = resourceCtrl.datatableTarget.getAttribute('data-datatable-enable-row-groups-value') === 'true';
  const content = displayOptionsPopoverContent(groupByResourceName, enableRowGroups, resourceCtrl.checkboxFiltersValue);
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

function displayOptionsPopoverContent(groupByResourceName, enableRowGroups, checkboxFilters) {
  return `
    <div class="form-horizontal">
      <div class="form-group">
        <label class="col-sm-3 control-label">Group</label>
        <div class="col-sm-9">
          <div class="checkbox">
            <label for="group-by-${kebabize(groupByResourceName)}">
              <input 
                type="checkbox" 
                id="group-by-${kebabize(groupByResourceName)}" 
                data-action="table-display-options#toggleRowGroups"
                ${enableRowGroups ? 'checked' : ''}>
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