import ResourceController from "./resource_controller";
import { dataTableConfig } from '../customer_wins/customer_wins';

export default class CustomerWinsController extends ResourceController {
  static values = {
    ... super.values, 
    rowGroupDataSource: { type: String, default: 'customer.name' }
  };
  declare rowGroupDataSourceValue: string;

  get tableConfig() {
    return dataTableConfig(this.rowGroupDataSourceValue);
  }
}