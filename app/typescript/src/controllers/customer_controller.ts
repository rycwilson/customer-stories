import FormController from './form_controller';
import { imageValidatorOptions } from '../user_uploads';

export default class CustomerController extends FormController<CustomerController> {
  static targets = ['logoContainer'];
  declare readonly logoContainerTarget: HTMLDivElement;

  connect() {
    super.connect();
    $(this.element).validator(imageValidatorOptions);
  }

  disconnect() {
    super.disconnect()
    $(this.element).validator('destroy');
  }

  toggleShowName(e: Event) {
    this.logoContainerTarget.classList.toggle('with-customer-name');
  }
}