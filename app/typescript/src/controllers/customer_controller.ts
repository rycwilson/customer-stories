import FormController from './form_controller';
import { imageValidatorOptions } from '../user_uploads';

export default class CustomerController extends FormController<CustomerController> {
  connect() {
    super.connect();
    $(this.element).validator(imageValidatorOptions);
  }

  disconnect() {
    $(this.element).validator('destroy');
    super.disconnect();
  }
}