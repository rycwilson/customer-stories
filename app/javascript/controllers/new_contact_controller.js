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
    this.formCtrl()[this.parentSelectTargetValue].disabled = shouldEnable;
    this.contactFieldTargets.forEach(input => {
      input.disabled = !shouldEnable;
      if (!shouldEnable && input.type !== 'hidden') input.value = '';

      // validate 
      // if (input.type !== 'hidden') input.required = true;

    });
    if (shouldEnable) this.firstNameTarget.focus();
  }

  // parent form controller
  formCtrl() {
    this.formController = this.formController || (
      (this.element.hasAttribute(`data-${this.identifier}-customer-win-form-outlet`) && this.customerWinFormOutlet) ||
      (this.element.hasAttribute(`data-${this.identifier}-contribution-form-outlet`) && this.contributionFormOutlet)
    );
    return this.formController;
  }
}