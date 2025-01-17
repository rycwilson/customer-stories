import FormController from './form_controller';
import { imageValidatorOptions } from '../user_uploads';

export default class UserProfileController extends FormController<UserProfileController> {
  connect() {
    super.connect();
    // TODO: validate the photo_url field only, re-enable the bootstrap validator
    // $(this.element).validator(imageValidatorOptions);
  }

  disconnect() {
    // $(this.element).validator('destroy');
    super.disconnect();
  }

  onUploadReady({ detail: { card } }: { detail: { card: HTMLLIElement } }) {
    console.log('user photo uploaded')
  }
}