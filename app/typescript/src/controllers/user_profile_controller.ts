import FormController from './form_controller';

export default class UserProfileController extends FormController<UserProfileController> {
  static targets = ['userField', 'emailField', 'currentPasswordField', 'passwordField', 'passwordConfirmationField', 'editBtn'];
  declare readonly userFieldTargets: HTMLInputElement[];
  declare readonly emailFieldTarget: HTMLInputElement;
  declare readonly currentPasswordFieldTarget: HTMLInputElement;
  declare readonly passwordFieldTarget: HTMLInputElement;
  declare readonly passwordConfirmationFieldTarget: HTMLInputElement;
  declare readonly editBtnTargets: HTMLElement[];

  get hasInvalidNewPassword() {
    return !this.passwordFieldTarget.checkValidity();
  }

  get passwordsDoNotMatch() {
    return this.passwordFieldTarget.value !== this.passwordConfirmationFieldTarget.value;
  }
  
  resetUserFields() {
    this.userFieldTargets.forEach(input => {
      input.value = <string>input.dataset.initialValue;
      input.disabled = true;
    });
  }
  
  enableProtectedField(input: HTMLInputElement) {
    this.resetUserFields();
    this.editBtnTargets.forEach(inputGroupBtn => inputGroupBtn.remove());
    this.currentPasswordFieldTarget.value = '';
    this.currentPasswordFieldTarget.disabled = false;
    input.disabled = false;
  }

  changeEmail(e: Event) {
    this.enableProtectedField(this.emailFieldTarget);
  }

  changePassword(e: Event) {
    this.enableProtectedField(this.currentPasswordFieldTarget);
    [this.passwordFieldTarget, this.passwordConfirmationFieldTarget].forEach(input => input.disabled = false);
    this.element.classList.add('has-new-password');
    this.submitBtnTarget.value = 'Change password';
    setTimeout(() => this.currentPasswordFieldTarget.focus()); // focus after the DOM update
  }

  validate(e: SubmitEvent) {
    let isValid = super.validate(e);

    // We want to validate the password confirmation separately so as to give it a single help message (.help-block element),
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