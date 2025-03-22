import FormController from './form_controller';

export default class UserProfileController extends FormController<UserProfileController> {
  static targets = ['emailField', 'phoneField', 'passwordField', 'newPasswordField', 'newPasswordConfirmationField'];
  declare readonly emailFieldTarget: HTMLInputElement;
  declare readonly phoneFieldTarget: HTMLInputElement;
  declare readonly passwordFieldTarget: HTMLInputElement;
  declare readonly newPasswordFieldTarget: HTMLInputElement;
  declare readonly newPasswordConfirmationFieldTarget: HTMLInputElement;

  editEmail({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
    this.enableProtectedField(this.emailFieldTarget, btn);
  }

  editPhone({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
    this.enableProtectedField(this.phoneFieldTarget, btn);
  }

  enableProtectedField(input: HTMLInputElement, btn: HTMLButtonElement) {
    input.disabled = false;
    this.passwordFieldTarget.disabled = false;
    btn.parentElement!.remove();
  }

  changePassword(e: Event) {
    // this.passwordFieldTarget.disabled = false;
  }
}