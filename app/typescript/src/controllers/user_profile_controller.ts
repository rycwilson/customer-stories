import FormController from './form_controller';
import type { FormSubmission, TurboSubmitStartEvent, TurboSubmitEndEvent } from '@hotwired/turbo';

type CustomFormSubmission = FormSubmission & { photoFileInput?: HTMLInputElement };

export default class UserProfileController extends FormController<UserProfileController> {
  static targets = [
    ...super.targets,
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

  get imageCard() {
    return this.imageCardTargets[0];
  }

  onSubmitStart(e: TurboSubmitStartEvent) {
    const uploadingPhoto = this.imageCard.classList.contains('image-card--uploading'); 
    if (uploadingPhoto) {
      // A successful response will replace #user-photo, so we want to capture the existing
      // file input and remove the validator listeners associated with it.
      const { formSubmission }: { formSubmission: CustomFormSubmission } = e.detail;
      formSubmission.photoFileInput = [...this.element.elements].find(el => (
        el instanceof HTMLInputElement && el.type === 'file'
      )) as HTMLInputElement;

      // Submit the user[photo_url] param only
      const { body } = formSubmission;
      const keep = new Set(['_method', 'authenticity_token', 'user[photo_url]']);
      for (const key of body.keys()) {
        if (keep.has(key)) continue;
        body.delete(key);
      }
    } else {
      super.onSubmitStart(e);
    }
  }

  onSubmitEnd(e: TurboSubmitEndEvent) {
    const { success, formSubmission }: { success: boolean; formSubmission: CustomFormSubmission }
      = e.detail;
    if (success && formSubmission.photoFileInput) {
      this.removeValidatorListeners(formSubmission.photoFileInput);
    }
    super.onSubmitEnd(e);
  }
  
  onPhotoUploadReady() {
    this.element.requestSubmit();
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
    [this.passwordInputTarget, this.passwordConfirmationInputTarget]
      .forEach(input => input.disabled = false);
    this.element.classList.add('has-new-password');
    this.submitBtnTarget.value = 'Change password';
    setTimeout(() => this.currentPasswordInputTarget.focus()); // focus after the DOM update
  }

  validate(e: SubmitEvent) {
    let isValid = super.validate(e);
    const changingPassword = !this.passwordConfirmationInputTarget.disabled;

    // We want to validate the password confirmation separately so that it can only display 
    // a "Passwords must match" error message. Presence and format errors can be flagged on 
    // the password input alone, and not repeated for the confirmation input.
    if (changingPassword) {
      const formGroup = <HTMLElement>this.passwordConfirmationInputTarget.closest('.form-group');
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