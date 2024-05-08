import FormController from './form_controller';

export default class InvitationTemplateController extends FormController<InvitationTemplateController> {
  static targets = ['note', 'nameField'];
  declare readonly noteTarget: HTMLDivElement;
  declare readonly nameFieldTarget: HTMLInputElement;
  
  connect() {
    this.nameFieldTarget.focus();
  }

  disconnect() {

  }

}