import FormController from './form_controller';

export default class UserProfileController extends FormController<UserProfileController> {
  static targets = ['userField', 'emailField', 'currentPasswordField', 'passwordField', 'passwordConfirmationField'];
  declare readonly userFieldTargets: HTMLInputElement[];
  declare readonly emailFieldTarget: HTMLInputElement;
  declare readonly currentPasswordFieldTarget: HTMLInputElement;
  declare readonly passwordFieldTarget: HTMLInputElement;
  declare readonly passwordConfirmationFieldTarget: HTMLInputElement;

  get hasInvalidNewPassword() {
    return !this.passwordFieldTarget.checkValidity();
  }

  get passwordsDoNotMatch() {
    return this.passwordFieldTarget.value !== this.passwordConfirmationFieldTarget.value;
  }

  editEmail({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
    this.enableProtectedField(this.emailFieldTarget, btn);
  }

  resetUserFields() {
    this.userFieldTargets.forEach(input => {
      input.value = <string>input.dataset.initialValue;
      input.disabled = true;
    });
  }

  enableProtectedField(input: HTMLInputElement, btn: HTMLButtonElement) {
    this.resetUserFields();
    input.disabled = false;
    this.element.classList.add('has-protected-field')
    this.currentPasswordFieldTarget.disabled = false;
    btn.parentElement!.remove();
  }

  changePassword(e: Event) {
    this.resetUserFields();                               // don't allow other updates when changing password
    this.emailFieldTarget.nextElementSibling!.remove();   // the edit button
    this.element.classList.add('has-new-password');
    [this.currentPasswordFieldTarget, this.passwordFieldTarget, this.passwordConfirmationFieldTarget].forEach(input => {
      input.disabled = false;
    });
    this.submitBtnTarget.value = 'Change password';
  }

  validate(e: SubmitEvent) {
    let isValid = super.validate(e);

    // here we are validating the password confirmation separately so as to give it a single help message (.help-block element)
    // i.e. presence and format errors can be flagged on the password input alone, and not repeated for the confirmation input
    if (this.passwordFieldTarget.disabled === false) {
      const formGroup = this.passwordConfirmationFieldTarget.closest('.form-group')!;
      if (isValid) {
        if (this.passwordsDoNotMatch) {
          e.preventDefault();
          e.stopPropagation();
          isValid = false;
          formGroup.classList.add('has-error');
          this.passwordConfirmationFieldTarget.focus();
        } 
      } else if (this.hasInvalidNewPassword) {
        formGroup.classList.remove('has-error');
        this.passwordConfirmationFieldTarget.value = '';
      }
    }
    return isValid;
  }
}