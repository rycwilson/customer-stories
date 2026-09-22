import FormController from './form_controller';

export default class UserProfileController extends FormController<UserProfileController> {
  static targets = [
    'userInput',
    'emailInput',
    'currentPasswordInput',
    'passwordInput',
    'passwordConfirmationInput',
    'editButtonWrapper'
  ];
  declare readonly userInputTargets: HTMLInputElement[];
  declare readonly emailInputTarget: HTMLInputElement;
  declare readonly currentPasswordInputTarget: HTMLInputElement;
  declare readonly passwordInputTarget: HTMLInputElement;
  declare readonly passwordConfirmationInputTarget: HTMLInputElement;
  declare readonly editButtonWrapperTargets: HTMLElement[];

  get hasInvalidNewPassword() {
    return !this.passwordInputTarget.checkValidity();
  }

  get passwordsDoNotMatch() {
    return this.passwordInputTarget.value !== this.passwordConfirmationInputTarget.value;
  }
  
  resetUserInputs() {
    this.userInputTargets.forEach(input => {
      input.value = <string>input.dataset.initialValue;
      input.disabled = true;
    });
  }
  
  enableProtectedField(input: HTMLInputElement) {
    this.resetUserInputs();
    this.editButtonWrapperTargets.forEach(div => div.remove());
    this.currentPasswordInputTarget.value = '';
    this.currentPasswordInputTarget.disabled = false;
    input.disabled = false;
  }

  changeEmail(_e: CustomEvent) {
    this.enableProtectedField(this.emailInputTarget);
  }

  changePassword(_e: CustomEvent) {
    this.enableProtectedField(this.currentPasswordInputTarget);
    [this.passwordInputTarget, this.passwordConfirmationInputTarget].forEach(input => input.disabled = false);
    this.element.classList.add('has-new-password');
    this.submitBtnTarget.value = 'Change password';
    setTimeout(() => this.currentPasswordInputTarget.focus()); // focus after the DOM update
  }

  validate(e: SubmitEvent) {
    let isValid = super.validate(e);

    // We want to validate the password confirmation separately so as to give it a single help message (.help-block element),
    // i.e. presence and format errors can be flagged on the password input alone, and not repeated for the confirmation input
    if (this.passwordInputTarget.disabled === false) {
      const formGroup = this.passwordConfirmationInputTarget.closest('.form-group')!;
      if (isValid) {
        if (this.passwordsDoNotMatch) {
          e.preventDefault();
          e.stopPropagation();
          isValid = false;
          formGroup.classList.add('has-error');
          this.passwordConfirmationInputTarget.focus();
        } 
      } else if (this.hasInvalidNewPassword) {
        formGroup.classList.remove('has-error');
        this.passwordConfirmationInputTarget.value = '';
      }
    }
    return isValid;
  }
}