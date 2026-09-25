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
    const changingPassword = !this.passwordConfirmationInputTarget.disabled;

    // We want to validate the password confirmation separately so that it only displays a
    // "Passwords must match" error message, i.e. presence and format errors can be flagged 
    // on the password input alone, and not repeated for the confirmation input.
    if (changingPassword) {
      const formGroup = this.passwordConfirmationInputTarget.closest('.form-group')!;
      const helpBlock = formGroup.querySelector('.help-block--validation');
      if (isValid) {
        if (this.passwordsDoNotMatch) {
          e.preventDefault();
          isValid = false;
          formGroup.classList.add('has-error', 'has-error--validation');
          helpBlock!.textContent = 'Passwords must match';
          this.passwordConfirmationInputTarget.focus();
        } 
      } else if (this.hasInvalidNewPassword) {
        formGroup.classList.remove('has-error', 'has-error--validation');
        this.passwordConfirmationInputTarget.value = '';
      }
    }
    return isValid;
  }
}