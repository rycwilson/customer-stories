import type { Visitors, VisitorsFilters } from '../lib';
import ResourceController from './resource_controller';

export default class VisitorsController extends ResourceController {
  static targets = [...super.targets, 'columnChart', 'tableChart'];

  declare filtersValue: VisitorsFilters;
  
  protected declare resource: Visitors;
  
  private declare readonly columnChartTarget: HTMLDivElement;
  private declare readonly tableChartTarget: HTMLDivElement;
  
  async initValueChanged(shouldInit: boolean) {
    if (!shouldInit) return;

    const data = await this.resource.init(
      this.dataPathValue,
      this.filtersValue,
      this.columnChartTarget,
      this.tableChartTarget
    );
    this.setAppData(data);
    this.dispatch('ready');
  }

  filtersValueChanged(filters: VisitorsFilters, prevFilters: VisitorsFilters) {
    if (Object.keys(prevFilters).length === 0) return;  // ignore initial assignment

    this.resource.handleFiltersChanged(filters);
  }

  handleSearchSelectChanged(e: CustomEvent) {
    const { id: filter } = e.detail;
    const filters = this.filtersValue as VisitorsFilters;
    if (filter) {
      const [filterKey, filterVal] = filter.split('-');
      this.filtersValue = { ...filters, ...{ [filterKey]: +filterVal } };
    } else {
      const { story: _s, category: _c, product: _p, ...rest } = filters;
      this.filtersValue = rest;
    }
  }
}