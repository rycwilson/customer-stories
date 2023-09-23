import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static outlets = ['customer-win-form', 'contribution-form'];
  static targets = ['contactField', 'firstName'];
  static values = { 
    shouldEnable: { type: Boolean, default: false },
    parentSelectTarget: String
  };

  formController;

  shouldEnableValueChanged(shouldEnable, wasEnabled) {
    if (wasEnabled === undefined) return false;
    this.element.classList.toggle('hidden', !shouldEnable);
    this.formCtrl[this.parentSelectTargetValue].disabled = shouldEnable;
    this.contactFieldTargets.forEach(input => {
      input.disabled = !shouldEnable;
      if (!shouldEnable && input.type !== 'hidden') input.value = '';

      // validate 
      // if (input.type !== 'hidden') input.required = true;

    });
    if (shouldEnable) this.firstNameTarget.focus();
  }

  // parent form controller
  get formCtrl() {
    this.formController = this.formController || (
      (this.hasCustomerWinFormOutlet && this.customerWinFormOutlet) ||
      (this.hasContributionFormOutlet && this.contributionFormOutlet)
    );
    return this.formController;
  }
}