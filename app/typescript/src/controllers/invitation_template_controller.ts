import FormController from './form_controller';

export default class InvitationTemplateController extends FormController<InvitationTemplateController> {
  static targets = ['note'];
  declare readonly noteTarget: HTMLDivElement;
}