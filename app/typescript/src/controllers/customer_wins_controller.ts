import ResourceController from "./resource_controller";
import { dataTableConfig } from '../customer_wins/customer_wins';

export default class CustomerWinsController extends ResourceController {
  get tableConfig() {
    return dataTableConfig();
  }
}