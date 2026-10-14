import type TableNavController from "./table_nav_controller";
import ResourceController from './resource_controller';
import { dataTableConfig } from '../contributions/contributions';

export default class ContributionsController extends ResourceController {
  static outlets = [...super.outlets, 'table-nav'];
  declare readonly tableNavOutlet: TableNavController;

  static values = {
    ... super.values, 
    
    // For including an inline select in the table row (currently unused)
    invitationTemplateSelectHtml: { type: String, default: '' },
  };
  declare filtersValue: ContributionsFilters;
  declare readonly invitationTemplateSelectHtmlValue: string;

  get tableConfig() {
    const storyId = this.element.dataset.storyId ? +this.element.dataset.storyId : undefined;
    return dataTableConfig(
      this.invitationTemplateSelectHtmlValue,
      this.rowGroupColumnValue,
      storyId
    );
  }

  get filtersToSearchObjects() {
    return [
      ...this.sharedSearchObjects,
      ...Object.entries(this.filtersValue).flatMap(([key, value]) => {
        switch (key) {
          case 'show-completed': {
            const checked = value;
            return { column: 'status', q: checked ? '' : '^((?!completed).)*$', regEx: true, smartSearch: false };
          }
          case 'show-published': {
            const checked = value;
            return { column: 'storyPublished', q: checked ? '' : 'false', regEx: false, smartSearch: false };
          }
          default:
            return [];
        }
      })
    ]
  }
}