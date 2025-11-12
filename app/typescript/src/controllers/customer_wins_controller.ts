import ResourceController from "./resource_controller";
import { dataTableConfig, toggleColumnVisibility } from '../customer_wins/customer_wins';

export default class CustomerWinsController extends ResourceController {
  static values = {
    ... super.values, 
    rowGroupDataSource: { type: String }
  };
  declare rowGroupDataSourceValue: 'customer.name' | '';

  toggleColumns = toggleColumnVisibility;

  get tableConfig() {
    return dataTableConfig(this.rowGroupDataSourceValue);
  }
}