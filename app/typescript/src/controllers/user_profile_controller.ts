import FormController from './form_controller';
import { imageValidatorOptions } from '../user_uploads';

export default class UserProfileController extends FormController<UserProfileController> {
  connect() {
    super.connect();
    $(this.element).validator(imageValidatorOptions);
  }

  disconnect() {
    $(this.element).validator('destroy');
    super.disconnect();
  }

  onAjaxSuccess({ detail: [data, status, xhr] }: { detail: [data: any, status: string, xhr: XMLHttpRequest] }) {
  }

  onUploadReady({ detail: { card } }: { detail: { card: HTMLLIElement } }) {
    console.log('user photo uploaded')
  }
}