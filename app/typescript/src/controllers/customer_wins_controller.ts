import ResourceController from "./resource_controller";
import { dataTableConfig, newCustomerWinPath } from '../customer_wins/customer_wins';

export default class CustomerWinsController extends ResourceController {
  get tableConfig() {
    return dataTableConfig();
  }
}