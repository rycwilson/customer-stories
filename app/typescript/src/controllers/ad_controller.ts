import FormController from './form_controller';

export default class AdController extends FormController<AdController> {
  static targets = [...super.targets, 'adImageCheckbox'];
  declare readonly adImageCheckboxTargets: HTMLInputElement[];

  toggleAdImage(e: CustomEvent<{ card: HTMLElement }>) {
    const { card } = e.detail;
    const checkbox = <HTMLInputElement>this.adImageCheckboxTargets.find(input => (
      card.contains(input)
    ));
    checkbox.checked = !checkbox.checked;
  }
}
