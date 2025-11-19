import ResourceController from './resource_controller';
import { dataTableConfig, toggleColumnVisibility } from '../contributions/contributions';

export default class ContributionsController extends ResourceController {
  static values = {
    ... super.values, 
    rowGroupDataSource: { type: String, default: 'customer.name' },
    
    // For including an inline select in the table row (currently unused)
    invitationTemplateSelectHtml: { type: String, default: '' },
  };
  declare filtersValue: ContributionsFilters;
  declare rowGroupDataSourceValue: (
    'contributor.full_name' | 
    'customer.name' | 
    'customer_win.name' | 
    'invitation_template.name' |
    ''
  );
  declare readonly invitationTemplateSelectHtmlValue: string;

  toggleColumns = toggleColumnVisibility;

  get tableConfig() {
    const storyId = this.element.dataset.storyId ? +this.element.dataset.storyId : undefined;
    return dataTableConfig(
      this.invitationTemplateSelectHtmlValue,
      this.rowGroupDataSourceValue,
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