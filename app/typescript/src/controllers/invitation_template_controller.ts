import FormController from './form_controller';
import type { FrameElement } from '@hotwired/turbo';

export default class InvitationTemplateController extends FormController<InvitationTemplateController> {
  static targets = ['templateSelect', 'turboFrame'];
  declare templateSelectTarget: TomSelectInput;
  declare turboFrameTarget: FrameElement;

  connect() {
    console.log('connect invitation templates')
  }

  onChangeTemplate({ target: select }: { target: TomSelectInput }) {
    console.log('change template', select)
    this.turboFrameTarget.innerHTML = '';
    const isNewTemplate = isNaN(+select.value);
    const templateId = +select.value || null;
    const action = isNewTemplate ? 'new' : (templateId ? 'edit' : null);
    const path = action ? <string>this.turboFrameTarget.dataset[`${action}TemplatePath`] : null;
    this.turboFrameTarget.setAttribute('id', action ? `${action}-invitation-template` : '');
    this.turboFrameTarget.setAttribute(
      'src', 
      path ? (action === 'new' ? path : path.replace(':id', (templateId as number).toString())) : ''
    );  
  }
}