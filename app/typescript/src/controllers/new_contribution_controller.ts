import FormController from './form_controller';
import { autofillNewContactPasswords } from '../utils';

export default class NewContributionController extends FormController<NewContributionController> {
  // Any shared targets can be defined through `static targets` in the parent controller.
  // When narrowing the `this` context (as in FormController methods,
  // declarations must appear in each subclass
  declare readonly customerSelectTarget: TomSelectInput;
  declare readonly customerFieldTargets: HTMLInputElement[];
  declare readonly customerNameTarget: HTMLInputElement;
  declare readonly customerWinSelectTarget: TomSelectInput;
  declare readonly successFieldTargets: HTMLInputElement[];
  declare readonly successNameTarget: HTMLInputElement;
  declare readonly contributorSelectTarget: TomSelectInput;
  declare readonly contributorFieldsTarget: HTMLDivElement;
  declare readonly contributorFieldTargets: HTMLInputElement[];
  declare readonly referrerSelectTarget: TomSelectInput;
  declare readonly referrerFieldsTarget: HTMLDivElement;
  declare readonly referrerFieldTargets: HTMLInputElement[];

  connect() {
    super.connect();
    autofillNewContactPasswords.bind(this)();
  }
}