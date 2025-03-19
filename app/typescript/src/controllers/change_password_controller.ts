import { type TurboSubmitEndEvent } from '@hotwired/turbo';
import FormController from './form_controller';

export default class ChangePasswordController extends FormController<ChangePasswordController> {
  static targets = ['newPassword', 'newPasswordConfirmation'];
  declare readonly newPasswordTarget: HTMLInputElement;
  declare newPasswordConfirmationTarget: HTMLInputElement;

  get hasInvalidNewPassword() {
    return !this.newPasswordTarget.checkValidity();
  }

  get passwordsDoNotMatch() {
    return this.newPasswordTarget.value !== this.newPasswordConfirmationTarget.value;
  }

  validate(e: SubmitEvent) {
    let isValid = super.validate(e);

    // here we are validating the password confirmation separately so as to give it a single help message (.help-block element)
    // i.e. presence and format errors can be flagged on the password input alone, and not repeated for the confirmation input
    if (isValid) {
      if (this.passwordsDoNotMatch) {
        e.preventDefault();
        e.stopPropagation();
        isValid = false;
        (<HTMLElement>this.newPasswordConfirmationTarget.closest('.form-group')).classList.add('has-error');
        this.newPasswordConfirmationTarget.focus();
      } 
    } else if (this.hasInvalidNewPassword) {
      this.newPasswordConfirmationTarget.value = '';
    }
    return isValid;
  }
}