import ResourceController from './resource_controller';
import { dataTableConfig } from '../promoted_stories/promoted_stories';

export default class PromotedStoriesController extends ResourceController {
  get tableConfig() {
    return dataTableConfig();
  }
}