import ResourceController from './resource_controller';
import { dataTableConfig } from '../promoted_stories/promoted_stories';

export default class PromotedStoriesController extends ResourceController {
  static values = {
    ... super.values, 
    rowGroupDataSource: { type: String, default: 'customer.name' }
  };
  declare filtersValue: PromotedStoriesFilters;
  declare rowGroupDataSourceValue: string;

  // toggleColumns = toggleColumnVisibility;

  get tableConfig() {
    return dataTableConfig(this.rowGroupDataSourceValue);
  }
}