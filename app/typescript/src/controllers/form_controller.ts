import { Controller } from '@hotwired/stimulus';

export default class FormController extends Controller<HTMLFormElement> {
  static targets = ['requiredField'];
  declare readonly requiredFieldTargets: [HTMLSelectElement | HTMLInputElement];

  connect() {
    // console.log('connect form')
    this.removeErrorsOnValidInput();
  }

  beforeSendXHR(e: CustomEvent) {
    // console.log(e)
    if (!this.isValid()) {
      e.preventDefault();
    }
  }
  
  isValid() {
    let isValid = true;
    this.requiredFieldTargets.filter(field => !field.disabled).forEach(field => {
      const formGroup = field.closest('.form-group') as HTMLDivElement;
      if (!field.value.trim()) {
        formGroup.classList.add('has-error');
        isValid = false;
      }
    });
    if (!this.element.classList.contains('was-validated')) this.element.classList.add('was-validated');
    return isValid;
  }

  removeErrorsOnValidInput() {
    const removeError = (e: Event) => {
      const field = e.target as HTMLSelectElement | HTMLInputElement;
      if (field.value.trim()) {
        (field.closest('.form-group') as HTMLDivElement).classList.remove('has-error');
      }
    }
    this.requiredFieldTargets.forEach(field => {
      field.addEventListener(field instanceof HTMLSelectElement ? 'change' : 'input', removeError);
    })
  }
}