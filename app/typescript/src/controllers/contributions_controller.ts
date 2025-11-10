import ResourceController from './resource_controller';
import { colIndices, dataTableConfig } from '../contributions/contributions';

export default class ContributionsController extends ResourceController {
  static values = {
    ... super.values, 
    rowGroupDataSource: { type: String, default: 'customer_win.name' },
    
    // For including an inline select in the table row (currently unused)
    invitationTemplateSelectHtml: { type: String, default: '' },
  };
  declare rowGroupDataSourceValue: string;
  declare readonly invitationTemplateSelectHtmlValue: string;

  get tableConfig() {
    const storyId = this.element.dataset.storyId ? +this.element.dataset.storyId : undefined;
    return dataTableConfig(
      this.invitationTemplateSelectHtmlValue,
      this.rowGroupDataSourceValue,
      storyId
    );
  } 
}