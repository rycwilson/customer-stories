import { type Config } from 'datatables.net';
import { type SearchObject } from './datatables';
import { FetchRequest } from '@rails/request.js';

type FetchedData = SourceData[] | import('.').VisitorsSourceData

export default abstract class Resource {
  container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  abstract dataTableConfig(options: DataTableConfigOptions): Config;
  
  searchObjects(filters: ResourceFilters): SearchObject[] {
    const curatorId = filters.curator;
    return [{ 
      column: 'curator',
      q: curatorId ? `^${curatorId}$` : '',
      regEx: true,
      smartSearch: false
    }];
  }
  
  async init(dataPath: string, ..._rest: (ResourceFilters | HTMLElement)[]): Promise<FetchedData> {
    // Only Visitors overrides this method. All others will return SourceData[]
    return await this.getJSON<SourceData[]>(dataPath);
  }

  async getJSON<T>(dataPath: string, params?: URLSearchParams): Promise<T> {
    // console.log('Fetching data from...', dataPath)
    const req = new FetchRequest('get', `${dataPath}.json${params ? `?${params.toString()}` : ''}`);
    const res = await req.perform();
    if (res.ok) return await res.json;
    else throw new Error('Error fetching JSON data');
  }

  initDisplayOptions(button: HTMLButtonElement, content: string, isReset = false) {
    if (isReset) {
      $(button).data()['bs.popover'].options.content = content;
    } else {
      $(button).popover({
        content: content,
        html: true,
        animation: false,
        container: 'body',
        viewport: { selector: 'body', padding: 70 },
        title: this.container.id === 'stories' ? 'Filters' : 'Display Preferences',
        placement: 'auto left',
        template: `
          <div
            class="popover ${this.container.id}" 
            data-controller="table-display-options" 
            data-table-display-options-resource-outlet="#${this.container.id}"
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
              <!-- content goes here -->
            </div>
          </div>
        `,
      });
    }
  }

  // Transform source row data to RowData used by ResourceController
  // This involves transformation to cameCase and filtering out unneeded fields
  protected abstract transformSourceData(row: SourceData): RowData;
  
  protected abstract actionsDropdownTemplate(row: SourceData): string;

}