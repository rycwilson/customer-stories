import ResourceController from './resource_controller';
import { dataTableConfig } from '../promoted_stories/promoted_stories';

export default class PromotedStoriesController extends ResourceController {
  declare filtersValue: PromotedStoriesFilters;

  get tableConfig() {
    return dataTableConfig(this.rowGroupColumnValue);
  }

  get filtersToSearchObjects() {
    return [
      ...this.sharedSearchObjects,
      // ...Object.entries(this.filtersValue).flatMap(([key, value]) => {
      //   switch (key) {
      //     default:
      //       return [];
      //   }
      // })
    ];
  }
}
