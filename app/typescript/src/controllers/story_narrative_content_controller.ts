import type { TurboSubmitStartEvent, TurboSubmitEndEvent, FormSubmission } from '@hotwired/turbo';
import FormController from './form_controller';

export default class StoryNarrativeContentController extends FormController<StoryNarrativeContentController> {
  static targets = [
    'titleInput',
    'titleSubmit',
    'newResultInput',
    'newResultSubmit',
    'resultsList',
    'deleteResultSubmit',
  ];
  declare readonly titleInputTarget: HTMLInputElement;
  declare readonly titleSubmitTarget: HTMLButtonElement;
  declare readonly newResultInputTarget: HTMLInputElement;
  declare readonly newResultSubmitTarget: HTMLButtonElement;
  declare readonly resultsListTarget: HTMLOListElement;
  declare readonly deleteResultSubmitTarget: HTMLButtonElement;

  // The same submission object is included in both 
  // TurboSubmitStartEvent and TurboSubmitStopEvent events
  activeSubmissions: Record<string, FormSubmission & { stopped?: boolean }> = {};

  activeResult: { item: HTMLLIElement, cancelButton: HTMLButtonElement, sortHandle?: HTMLElement } | null = null;

  onSubmitStart(e: TurboSubmitStartEvent) {
    // console.log('start', e)
    const { formSubmission }: { formSubmission: FormSubmission & { stopped?: boolean } } = e.detail;
    const { body, submitter } = formSubmission;
    const fieldName = submitter?.dataset.fieldName;
    
    if (!submitter || !fieldName) return;
    
    // console.log(`submitting ${fieldName}`)
    
    if (this.activeSubmissions[fieldName]) {
      // console.log(`stopping ${fieldName}`)
      formSubmission.stopped = true;
      formSubmission.stop();
      return;
    }

    if (this.activeResult) {
      this.activeResult.cancelButton.disabled = true;
      $(this.activeResult.cancelButton).tooltip('destroy');
      this.activeResult.sortHandle?.classList.add('list-group-item__handle--disabled');
    }

    // Remove all other fields from the submission body to avoid unnecessary data in the payload.
    const keep = new Set(['_method', 'authenticity_token']);
    for (const key of [...body.keys()]) {
      if (keep.has(key)) continue;
      if (key !== fieldName) body.delete(key);
    }

    this.activeSubmissions[fieldName] = formSubmission;
    this.animateSubmit(e, submitter);
  }

  onSubmitEnd(e: TurboSubmitEndEvent) {
    // console.log('end', e)
    const { formSubmission }: { formSubmission: FormSubmission & { stopped?: boolean } } = e.detail;
    const { submitter } = formSubmission;
    const fieldName = submitter?.dataset.fieldName;

    if (!submitter || !fieldName || formSubmission.stopped) return;
    
    delete this.activeSubmissions[fieldName];

    submitter.classList.remove('submitting', 'btn--working');
    submitter.classList.add('hidden');
  }

  onTitleInput({ target: input }: { target: HTMLInputElement }) {
    const min = input.minLength;
    const max = input.maxLength;
    if (isNaN(min) || isNaN(max)) return;

    const len = input.value.trim().length;
    const isValid = len >= min && len <= max;
    this.titleSubmitTarget.classList.toggle('hidden', !isValid);
    // btn.classList.toggle('disabled', !isValid);
    // this.titleSubmitTarget.disabled = !isValid;
  }

  onNewResultInput({ target: input }: { target: HTMLInputElement }) {
    // const min = input.minLength;
    // const max = input.maxLength;
    // if (isNaN(min) || isNaN(max)) return;
    
    const len = input.value.trim().length;
    // const isValid = len >= min && len <= max;
    this.toggleNewResult(len > 0);
  }
  
  toggleNewResult(shouldEnable: boolean) {
    const cancelButton = <HTMLElement>this.newResultInputTarget.nextElementSibling;
    cancelButton.classList.toggle('hidden', !shouldEnable);
    this.newResultSubmitTarget.classList.toggle('hidden', !shouldEnable);
    this.newResultInputTarget.name = shouldEnable ? 'story[new_results][]' : '';
    
    // The new result isn't strictly part of the list, but we want to disable click events 
    // in the list while the new result field has a value and this effectively does so.
    this.resultsListTarget.classList.toggle('list-group--has-active', shouldEnable);
  }

  cancelNewResult() {
    this.newResultInputTarget.value = '';
    this.newResultInputTarget.dispatchEvent(new Event('input', { bubbles: true }));
    this.newResultInputTarget.focus();
  }

  onSortedResults(
    { detail: { item, oldIndex, newIndex } }: 
    CustomEvent<{ item: HTMLElement, oldIndex: number, newIndex: number }>
  ) {
    console.log(`from ${oldIndex} to ${newIndex}`, item);
    this.resultsListTarget.classList.add('list-group--submitting-sort');
    this.element.requestSubmit();
  }

  deleteResult({ detail: { input } }: { detail: { input: HTMLInputElement } }) {
    input.name = '';
    this.element.requestSubmit();
  }

  onToggleEditResult(
    { detail: { item, isEditable, cancelButton, sortHandle } }: 
    { 
      detail: { 
        item: HTMLLIElement
        isEditable: boolean,
        cancelButton: HTMLButtonElement, 
        sortHandle?: HTMLElement
      }
    }
  ) {
    console.log(item, isEditable, cancelButton, sortHandle)
    this.activeResult = isEditable ? 
      { item, cancelButton, ...(sortHandle ? { sortHandle } : {}) } : 
      null;
  }
}