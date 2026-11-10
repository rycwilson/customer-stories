import { FetchRequest } from '@rails/request.js';

export type ResourceFilters =
  | import('.').StoriesFilters
  | import('.').CustomerWinsFilters
  | import('.').ContributionsFilters
  | import('.').AdwordsAdsFilters
  | import('.').VisitorsFilters;

type FetchedData = SourceData[] | import('.').VisitorsSourceData

export default abstract class Resource {
  static declare filtersKeys: KeysOfUnion<ResourceFilters>[];

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

  initDisplayOptions(title: string, button: HTMLButtonElement, content: string, isReset = false) {
    if (isReset) {
      $(button).data()['bs.popover'].options.content = content;
    } else {
      $(button).popover({
        content,
        html: true,
        animation: false,
        container: this.container,
        viewport: { selector: this.container.closest('.company__container') },
        title: title,
        placement: 'bottom',
        template: `
          <div
            class="popover ${this.container.id}-${title.toLowerCase()}"
            data-${this.container.id}-target="${title.toLowerCase()}Popover"
            role="tooltip">
            <div class="arrow"></div>
            <div class="popover-title__wrapper">
              <h4 class="popover-title"></h4>
              <button type="button" class="close" data-action="${this.container.id}#hidePopover" aria-label="Close">
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