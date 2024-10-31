// import { kebabize } from './utils';
import type ResourceController from './controllers/resource_controller';
// import { type Api as DataTableApi } from 'datatables.net-bs';

export function init(this: ResourceController) {
  this.datatableTarget.setAttribute('data-datatable-ready-value', 'true');
}

export function toggleRowGroups(this: ResourceController, shouldEnable: boolean) {
  this.datatableTarget.setAttribute('data-datatable-enable-row-groups-value', shouldEnable.toString());
}

export function search(this: ResourceController, tsSearchResults?: { [key: string]: string }) {
  const filters = Object.entries(this.filtersValue)
    .map(([filterId, filterVal]) => {
      const checked = filterId !== 'curator-id' && filterVal;
      switch (filterId) {
        case 'curator-id': {
          const curatorId = filterVal;
          return { column: 'curator', q: curatorId ? `^${curatorId}$` : '', regEx: true, smartSearch: false };
        }
        case 'show-wins-with-story':
          return { column: 'story', q: checked ? '' : '^false$', regEx: true, smartSearch: false };
        case 'show-completed':
          return { column: 'status', q: checked ? '' : '^((?!completed).)*$', regEx: true, smartSearch: false };
        case 'show-published':
          return { column: 'storyPublished', q: checked ? '' : 'false', regEx: false, smartSearch: false };
        default: 
          throw new Error('Unrecognized column filter');        
      }
    });

  // console.log(
  //   `searching ${this.resourceName}:`, 
  //   JSON.stringify({
  //     ...{ filters },
  //     ...tsSearchResults ? { tsSearchResults } : { searchVal: this.searchSelectTarget.value }
  //   })
  // )

  this.datatableTarget.setAttribute(
    'data-datatable-search-params-value', 
    JSON.stringify({
      ...{ filters },
      ...tsSearchResults ? { tsSearchResults } : { searchVal: this.searchSelectTarget.value }
    })
  );
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
      title: 'Table Preferences',
      placement: 'auto left',
      template: `
        <div 
          class="popover ${this.identifier}" 
          data-controller="table-display-options" 
          data-table-display-options-${this.identifier}-outlet="#${this.identifier}"
          data-action="tomselect:change-curator->table-display-options#onChangeCurator"
          role="tooltip">
          <div class="arrow"></div>
          <h3 class="popover-title label-secondary"></h3>
          <div class="popover-content">
            <!-- content goes here (setting above) -->
          </div>
        </div>
      `,
    });
  }
}