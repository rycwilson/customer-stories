import { type CustomerWinsFilters } from '../lib';
import TabularResourceController from './tabular_resource_controller';

export default class CustomerWinsController extends TabularResourceController {
  protected declare filtersValue: CustomerWinsFilters;

  filtersValueChanged(filters: CustomerWinsFilters, prevFilters: CustomerWinsFilters) {
    if (!this.initialized) return;
    
    const addedNewRecord = !prevFilters.success && filters.success;
    const removedNewRecord = prevFilters.success && !filters.success;
    if (addedNewRecord) {
      setTimeout(() => {
        const { ['success']: _, ...rest } = this.filtersValue as CustomerWinsFilters;
        this.filtersValue = rest;
      })
    } else if (removedNewRecord) {
      return;
    }
    super.filtersValueChanged(filters, prevFilters);
  }
}