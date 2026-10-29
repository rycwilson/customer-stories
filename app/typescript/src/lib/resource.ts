import { FetchRequest } from '@rails/request.js';

export type ResourceFilters = (
  import('.').StoriesFilters |
  import('.').CustomerWinsFilters |
  import('.').ContributionsFilters |
  import('.').VisitorsFilters
);

type FetchedData = SourceData[] | import('.').VisitorsSourceData

export default abstract class Resource {
  container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }
  
  async init(dataPath: string, ..._rest: (ResourceFilters | HTMLElement)[]): Promise<FetchedData> {
    return await this.getJSON<SourceData[]>(dataPath);
  }

  async getJSON<T>(dataPath: string, params?: URLSearchParams): Promise<T> {
    // console.log(`Fetching data from ${dataPath}...`)
    const req = new FetchRequest('get', `${dataPath}.json${params ? `?${params.toString()}` : ''}`);
    const res = await req.perform();
    if (res.ok) {
      const data = await res.json;
      // console.log(data);
      return data;
    } else {
      throw new Error(`Error fetching JSON data from ${dataPath}`);
    }
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
            data-controller="display-options" 
            data-display-options-${this.container.id}-outlet="#${this.container.id}"
            data-display-options-dashboard-outlet=".dashboard"
            role="tooltip">
            <div class="arrow"></div>
            <div class="popover-title__wrapper">
              <h3 class="popover-title label-secondary"></h3>
              <button type="button" class="close" data-action="display-options#hide" aria-label="Close">
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
}