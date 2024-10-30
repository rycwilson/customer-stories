import ResourceController from './resource_controller';
import { dataTableConfig } from '../contributions/contributions';

export default class ContributionsController extends ResourceController {
  static values = {... super.values, invitationTemplateSelectHtml: { type: String, default: '' } };
  declare readonly invitationTemplateSelectHtmlValue: string;

  // connect() {
  //   console.log('connect contributions')
  // }
  
  get tableConfig() {
    const storyId = this.element.dataset.storyId ? +this.element.dataset.storyId : undefined;
    return dataTableConfig(this.invitationTemplateSelectHtmlValue, storyId);
  } 
}