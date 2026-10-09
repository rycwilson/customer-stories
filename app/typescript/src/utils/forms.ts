import type { NewCustomerWinController, NewContributionController, NewStoryController } from '../controllers';
import type { TomOptions } from 'tom-select/dist/esm/types/core.d.ts';

export const sharedTargets = [
  'customerSelect',
  'customerField',
  'customerName',
  'customerWinSelect',
  'successField',
  'successName', 
  'contributorSelect', 
  'contributorFields',
  'contributorField',
  'referrerSelect',
  'referrerFields',
  'referrerField',
  'curatorSelect',
  'submitBtn',
  'submit',
  'imageCard'    
]

const correctionHandlers = new WeakMap<HTMLInputElement | TomSelectInput, (e: Event) => void>();

const handleValidationCorrection = (formGroup: HTMLElement | null, helpBlock: HTMLElement | null) => {
  return ({ target: control }: { target: HTMLInputElement | TomSelectInput }) => {
    if (formControlIsValid(control)) {
      formGroup?.classList.remove('has-error', 'has-error--validation');
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
    const helpBlock = formGroup.querySelector('.help-block--validation');
    formGroup?.classList.add('has-error', 'has-error--validation');
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
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) throw new Error('Expected form element');
  
  let isValid = true;
  
  // TODO: This only covers required fields, but optional fields can still require validation.
  const requiredFields: (HTMLInputElement | TomSelectInput)[] = ([
    ...form.querySelectorAll('input[required], select[required]')
  ]);
  requiredFields.forEach(control => {
    // Some select controls are disabled by toggling [name], which precludes ui (style) changes.
    if (control.disabled || !control.name || control.name === 'user[password_confirmation]') {
      return;
    }
    isValid = formControlIsValid(control) && isValid;
  });

  // The "was-validated" class comes from tom-select and is necessary because tom-select 
  // will add the "invalid" class for blank required fields whether or not validation has occurred
  form.classList.add('was-validated');

  if (!isValid) {
    e.preventDefault();
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

// body has type URLSearchParams when GET, else FormData
export function submitOnly(body: URLSearchParams | FormData, predicate: (key: string) => boolean) {
  const keep = new Set(['_method', 'authenticity_token']);
  for (const k of body.keys()) {
    if (keep.has(k) || predicate(k)) continue;
    body.delete(k);
  }
}

export function handleChangeCustomer(
  this: NewCustomerWinController | NewContributionController | NewStoryController, 
  { target: select }: { target: TomSelectInput }
) {
  const isNew = isNaN(+select.value);
  // const customerId = +select.value || null;

  // Enable/disable select elements via the [name] attribute => precludes ui changes
  select.setAttribute('name', isNew ? '' : select.dataset.fieldName);

  // Hidden fields for a new customer
  this.customerFieldTargets.forEach((field: HTMLInputElement) => field.disabled = !isNew);
  this.customerNameTarget.value = isNew ? select.value.trim() : '';

  // Reset customer win select options
  if (this.hasCustomerWinSelectTarget) {
    (this as NewContributionController | NewStoryController)
      .customerWinSelectTarget.tomselect.clear(true);
  } 
}

export function handleChangeCustomerWin(
  this: NewContributionController | NewStoryController,
  { target: select }: { target: TomSelectInput }
) {
  const isNew = isNaN(+select.value);
  const winId = +select.value || null;
  const wasCleared = !(isNew || winId);

  // Enable/disable select elements via the [name] attribute => precludes ui changes
  select.setAttribute('name', isNew || wasCleared ? '' : select.dataset.fieldName);

  // Hidden fields for a new customer win
  // For a new story, `placeholder: true` and `name: nil` for the associated success if none was specified
  // TODO successName and successPlaceholder needn't be targets -- just look for the name
  this.successFieldTargets.forEach((field: HTMLInputElement) => {
    if (field === this.successNameTarget) {
      field.disabled = !isNew;
      field.value = isNew ? select.value.trim() : '';
    } else if (
      this.hasSuccessPlaceholderTarget &&
      field === (this as NewStoryController).successPlaceholderTarget
    ) {
      field.checked = wasCleared;
      field.disabled = !!winId || isNew;
    } else {
      field.disabled = !!winId
    }
  });

  const updateContributorOptions = function (this: NewContributionController, winId: number) {
    const tsOptions = this.contributorSelectTarget.tomselect.options as TomOptions;

    // new story form can't presently have a contributor select, because it may not have access to the contributions data
    if (!CSP['contributions']) throw new Error('updateContributorOptions should only be called from Prospect section');
    const winContributorIds: number[] = CSP['contributions']
      .filter((contribution: Contribution) => contribution.customer_win!.id === winId)
      .map((contribution: Contribution) => contribution.contributor!.id);
    winContributorIds.forEach(contributorId => {
      const newOptionSettings = { value: contributorId, text: tsOptions[contributorId].text, disabled: true  };
      this.contributorSelectTarget.tomselect.updateOption(contributorId.toString(), newOptionSettings);
    });
  }
  const resetContributorOptions = function (this: NewContributionController) {
    const tsOptions = this.contributorSelectTarget.tomselect.options as TomOptions;
    Object.entries(tsOptions).forEach(([value, option]) => {
      if (option.disabled) {
        this.contributorSelectTarget.tomselect.updateOption(value, { value, text: option.text, disabled: false });
      }
    });
  }

  if (winId) {
    // set the customer select to the customer associated with the selected customer win
    let customerId;
    if (CSP['customerWins']) {
      const win = CSP['customerWins'].find((win: CustomerWin) => win.id === winId) as CustomerWin;
      customerId = win.customer.id;
    } else {
      const option = select.tomselect.options[winId];
      customerId = +(option as { customerId: string }).customerId;
    }
    this.customerSelectTarget.tomselect.setValue(customerId, true);

    // Disable contributor option for any contributors that already have a contribution for this customer win
    if (this.hasContributorSelectTarget) {
      updateContributorOptions.bind(this as NewContributionController)(winId);
    }
  } else if (this.hasContributorSelectTarget) {
    resetContributorOptions.bind(this as NewContributionController)();
  }
}

export function handleChangeContact(
  this: NewCustomerWinController | NewContributionController, 
  { target: select }: { target: TomSelectInput }
) {
  const contactType = select.dataset.tomselectKindValue as Extract<TomSelectKind, 'contributor' | 'referrer'>;
  const isNewContact = select.value === '0';
  const isExistingContact = select.value && !isNewContact;

  // Enable/disable select elements via the [name] attribute => precludes ui changes
  select.setAttribute('name', select.value && !isNewContact ? select.dataset.fieldName as string : '');
  this[`${contactType}FieldTargets`].forEach(input => {
    input.value = /success_contact|sign_up_code/.test(input.name) ? input.value : '';
    input.disabled = input.name.includes('success_contact') ? (!isExistingContact && !isNewContact) : !isNewContact;
    input.required = isNewContact && input.type !== 'hidden';
  });
  if (isNewContact) {
    this[`${contactType}FieldsTarget`].classList.remove('hidden');
    const firstName = this[`${contactType}FieldTargets`].find((input: HTMLInputElement) => input.name.includes('first'));
    firstName?.focus();
  } else {
    this[`${contactType}FieldsTarget`].classList.add('hidden');
  }
}

export function filterCustomerWinOptions(this: NewContributionController | NewStoryController) {
  const isNewCustomer = isNaN(+this.customerSelectTarget.value);
  const customerId = +this.customerSelectTarget.value || null;
  for (const [_, option] of Object.entries(this.customerWinSelectTarget.tomselect.options as TomOptions)) {
    option.$div.classList.toggle(
      'hidden',
      isNewCustomer || (customerId && customerId !== +option.customerId)
    );
  }
}

// For newly created contacts, autofill the password with the email
export function autofillNewContactPasswords(this: NewCustomerWinController | NewContributionController) {
  if (!this.contributorFieldTargets || !this.referrerFieldTargets) return;
  const referrerEmail = <HTMLInputElement>this.referrerFieldTargets.find(input => input.name.includes('email'));
  const referrerPassword = <HTMLInputElement>this.referrerFieldTargets.find(input => input.name.includes('password'));
  const contributorEmail = <HTMLInputElement>this.contributorFieldTargets.find(input => input.name.includes('email'));
  const contributorPassword = <HTMLInputElement>this.contributorFieldTargets.find(input => input.name.includes('password'));
  if (!referrerEmail || !referrerPassword || !contributorEmail || !contributorPassword) {
    throw new Error('Missing email or password inputs') 
  } else {
    [[referrerEmail, referrerPassword], [contributorEmail, contributorPassword]].forEach(([emailInput, passwordInput]) => {
      emailInput.addEventListener('input', (e) => {
        const email = (e.currentTarget as HTMLInputElement).value;
        passwordInput.value = email;
      });
    });
  }
}
