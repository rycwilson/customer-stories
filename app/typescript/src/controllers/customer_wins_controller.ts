import ResourceController from "./resource_controller";
import { dataTableConfig, toggleColumnVisibility } from '../customer_wins/customer_wins';

export default class CustomerWinsController extends ResourceController {
  static values = {
    ... super.values, 
    rowGroupDataSource: { type: String }
  };
  declare rowGroupDataSourceValue: 'customer.name' | '';
  declare filtersValue: CustomerWinsFilters;

  toggleColumns = toggleColumnVisibility;

  get tableConfig() {
    return dataTableConfig(this.rowGroupDataSourceValue);
  }

  get filtersToSearchObjects() {
    return [
      ...this.sharedSearchObjects,
      ...Object.entries(this.filtersValue).flatMap(([key, value]) => {
        switch (key) {
          case 'show-wins-with-story':
            const checked = value;
            // return { column: 'story', q: value ? 'not null' : 'null', regEx: true, smartSearch: false };
            return [{ column: 'story', q: checked ? '' : '^false$', regEx: true, smartSearch: false }];
          case 'success':
            const id = value;
            return [{ column: 'success', q: `^${id}$`, regEx: true, smartSearch: false }];
          default:
            return [];
        }
      })
    ]
  }
}