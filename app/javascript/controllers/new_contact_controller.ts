import { Controller } from '@hotwired/stimulus';
import CustomerWinFormController from './customer_win_form_controller';
import ContributionController from './contribution_controller';

export default class extends Controller<HTMLDivElement> {
  static outlets = ['customer-win-form', 'contribution-form'];
  declare readonly customerWinFormOutlet: HTMLFormElement;
  declare readonly hasCustomerWinFormOutlet: boolean;
  declare readonly contributionFormOutlet: HTMLFormElement;
  declare readonly hasContributionFormOutlet: boolean;

  static targets = ['contactField', 'firstName'];
  declare readonly contactFieldTargets: HTMLInputElement[];
  declare readonly firstNameTarget: HTMLInputElement;

  static values = { 
    shouldEnable: { type: Boolean, default: false },
    parentSelectTarget: String
  };
  declare readonly shouldEnableValue: boolean;
  declare readonly parentSelectTargetValue: string;

  declare formController: CustomerWinFormController | ContributionController;

  shouldEnableValueChanged(shouldEnable: boolean, wasEnabled: boolean) {
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