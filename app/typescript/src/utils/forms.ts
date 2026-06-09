// This module exports the following functions:
// - `validateForm` validates form controls on submit.
// - `serializeForm` serializes form data into a URL-encoded string, excluding the authenticity token.

const correctionHandlers = new WeakMap<HTMLInputElement | TomSelectInput, (e: Event) => void>();

const handleValidationCorrection = (formGroup: HTMLElement | null, helpBlock: HTMLElement | null) => {
  return ({ target: control }: { target: HTMLInputElement | TomSelectInput }) => {
    if (formControlIsValid(control)) {
      formGroup?.classList.remove('has-error');
      if (helpBlock) helpBlock.textContent = '';
      correctionHandlers.delete(control);
    }
  };
};

function formControlIsValid(control: HTMLInputElement | TomSelectInput) {
  const validityState = control.validity;
  if (validityState.valueMissing) {
    control.setCustomValidity('Required');
  } else if (validityState.typeMismatch) {
    control.setCustomValidity(`Must be valid ${control.type} format`);
  } else if (validityState.tooShort) {
    control.setCustomValidity(`Must be at least ${control.minLength} characters`);
  } else {
    control.setCustomValidity('');
  }
  const isValid = control.checkValidity();
  if (!isValid) {
    const formGroup = control.closest('.form-group');
    const helpBlock = formGroup.querySelector('.help-block');
    formGroup?.classList.add('has-error');
    if (helpBlock) helpBlock.textContent = control.validationMessage;

    const eventName = control instanceof HTMLSelectElement ? 'change' : 'input';

    // Avoid stacking multiple listeners for this control
    const existing = correctionHandlers.get(control);
    if (existing) control.removeEventListener(eventName, existing);
    
    const handler = handleValidationCorrection(formGroup, helpBlock);
    correctionHandlers.set(control, handler);
    control.addEventListener(eventName, handler, { once: true });
  }
  return isValid;
}

export function validateForm(e: SubmitEvent): boolean {
  const form = <HTMLFormElement>e.target;
  const requiredFields: (HTMLInputElement | TomSelectInput)[] = [...form.querySelectorAll('input[required], select[required]')];
  let isValid = true;
  requiredFields.forEach(control => {
    // Some select controls are disabled by toggling the [name] attribute, precludes ui (style) changes
    // inputs that are disabled via the [disabled] attribute are always valid
    if (control.disabled || !control.name || control.name === 'user[password_confirmation]') return;
    isValid = formControlIsValid(control) && isValid;
  });

  // The "was-validated" class comes from tom-select and is necessary because tom-select 
  // will add the "invalid" class for blank required fields whether or not validation has occurred
  form.classList.add('was-validated');

  if (!isValid) {
    e.preventDefault();
    e.stopPropagation();  // stops rails-ujs from disabling the submit button
    requiredFields.find(control => !control.checkValidity())?.focus();
  }
  return isValid;
}

export function serializeForm(form: HTMLFormElement) {
  const formData = new FormData(form);

  // Turbo / Rails UJS may refresh the authenticity token, leading to false comparisons, so exclude it
  const params = new URLSearchParams(
    [...formData.entries()]
      .filter(([k, _v]) => k !== 'authenticity_token')
      .map(([k, v]) => [k, String(v)])
  );
  return params.toString();
}
