import ResourceController from './resource_controller';
import { dataTableConfig, toggleColumnVisibility } from '../contributions/contributions';

export default class ContributionsController extends ResourceController {
  static values = {
    ... super.values, 
    rowGroupDataSource: { type: String, default: 'customer.name' },
    
    // For including an inline select in the table row (currently unused)
    invitationTemplateSelectHtml: { type: String, default: '' },
  };
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
}