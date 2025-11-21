import type TableNavController from "./table_nav_controller";
import ResourceController from "./resource_controller";
import { dataTableConfig, toggleColumnVisibility } from '../customer_wins/customer_wins';

export default class CustomerWinsController extends ResourceController {
  static outlets = [...super.outlets, 'table-nav'];
  declare readonly tableNavOutlet: TableNavController;

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

  filtersValueChanged(newFilters: CustomerWinsFilters, oldFilters: CustomerWinsFilters) {
    const addedNewRecord = !oldFilters.success && newFilters.success;
    const removedNewRecord = oldFilters.success && !newFilters.success;
    if (addedNewRecord) {
      setTimeout(() => {
        const { ['success']: _, ...rest } = this.filtersValue;
        this.filtersValue = rest;
      })
    } else if (removedNewRecord) {
      return;
    }
    super.filtersValueChanged(newFilters, oldFilters);
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