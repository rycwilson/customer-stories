import type { ResourceFilters, DataTableConfigOptions, SearchObject } from '.';
import { Resource } from '.';
import { type Config } from 'datatables.net';

export default abstract class TabularResource extends Resource {
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

  // Transform source row data to RowData used by ResourceController
  // This involves transformation to cameCase and filtering out unneeded fields
  protected abstract transformSourceData(row: SourceData): RowData;
  
  protected abstract actionsDropdownTemplate(row: SourceData): string;
}