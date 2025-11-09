import ResourceController from './resource_controller';
import { dataTableConfig } from '../contributions/contributions';

export default class ContributionsController extends ResourceController {
  static values = {
    ... super.values, 
    invitationTemplateSelectHtml: { type: String, default: '' },
    rowGroupDataSrc: { type: String, default: 'customer_win.name' }
  };
  declare readonly invitationTemplateSelectHtmlValue: string;
  declare readonly rowGroupDataSrcValue: string;
  
  get tableConfig() {
    const storyId = this.element.dataset.storyId ? +this.element.dataset.storyId : undefined;
    return dataTableConfig(
      this.invitationTemplateSelectHtmlValue,
      this.rowGroupDataSrcValue,
      storyId
    );
  } 

  rowGroupDataSrcValueChanged(newVal: string, oldVal: string) {
    if (oldVal === undefined) return;
  }
}