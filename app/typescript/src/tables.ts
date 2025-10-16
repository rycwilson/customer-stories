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
  const controller = this.identifier === 'visitors' ? 'visitors-display-options' : 'table-display-options';
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
          data-controller="${controller}" 
          data-${controller}-${this.identifier}-outlet="#${this.identifier}"
          data-${controller}-dashboard-outlet=".dashboard"
          data-action="tomselect:change-curator->${controller}#onChangeCurator"
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