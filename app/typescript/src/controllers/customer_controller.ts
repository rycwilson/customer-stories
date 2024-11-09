import FormController from './form_controller';

export default class CustomerController extends FormController<CustomerController> {
  static targets = ['logoContainer'];
  declare readonly logoContainerTarget: HTMLDivElement;

  toggleShowName(e: Event) {
    this.logoContainerTarget.classList.toggle('with-customer-name');
  }
}