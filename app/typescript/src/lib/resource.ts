import type { Config } from 'datatables.net';
import { FetchRequest } from '@rails/request.js';

export default abstract class Resource {
  constructor() {
  }

  abstract dataTableConfig(options: DataTableConfigOptions): Config
  
  // Transform source row data to `rowData` used by ResourceController
  // This involves transformation to cameCase and filtering out unneeded fields
  protected abstract transformSourceData(row: CustomerWin | Contribution | AdwordsAd): 
    CustomerWinRowData | ContributionRowData | AdwordsAdRowData 
  
  protected abstract actionsDropdownTemplate(row: CustomerWin | Contribution | AdwordsAd): string

  async getJSON(dataPath: string, params?: URLSearchParams) {
    const req = new FetchRequest('get', `${dataPath}.json${params ? `?${params.toString()}` : ''}`);
    const res = await req.perform();
    if (res.ok) return await res.json;
  }

  // Transform source row data to RowData used by ResourceController
  // This involves transformation to cameCase and filtering out unneeded fields
  protected abstract transformSourceData(row: SourceData): RowData;
  
  protected abstract actionsDropdownTemplate(row: SourceData): string;
}