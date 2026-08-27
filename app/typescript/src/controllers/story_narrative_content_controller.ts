import type { TurboSubmitStartEvent, TurboSubmitEndEvent, FormSubmission } from '@hotwired/turbo';
import FormController from './form_controller';
import Cookies from 'js-cookie';

export default class StoryNarrativeContentController extends FormController<StoryNarrativeContentController> {
  static targets = [
    'titleInput',
    'titleSubmit',
    'newResultInput',
    'newResultSubmit',
    'resultsList',
    'toggleResultsButton'
  ];
  declare readonly titleInputTarget: HTMLInputElement;
  declare readonly titleSubmitTarget: HTMLButtonElement;
  declare readonly newResultInputTarget: HTMLInputElement;
  declare readonly newResultSubmitTarget: HTMLButtonElement;
  declare readonly resultsListTarget: HTMLOListElement;
  declare readonly toggleResultsButtonTargets: HTMLButtonElement[];

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
    
    this.toggleResultsButtonTargets.forEach(btn => btn.disabled = true);
    // console.log(`submitting ${fieldName}`)
    
    // if (this.activeSubmissions[fieldName]) {
    //   // console.log(`stopping ${fieldName}`)
    //   formSubmission.stopped = true;
    //   formSubmission.stop();
    //   return;
    // }

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

    // this.activeSubmissions[fieldName] = formSubmission;
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

  onSortedResults(
    _e: CustomEvent<{ item: HTMLLIElement, oldIndex: number, newIndex: number }>
  ) {
    this.resultsListTarget.classList.add('list-group--sorting');
    this.element.requestSubmit();
  }

  deleteResult(e: CustomEvent<{ item: HTMLLIElement, input: HTMLInputElement }>) {
    const { input } = e.detail;
    input.name = '';
    this.element.requestSubmit();
  }

  onToggleEditResult(e: CustomEvent<{ 
    item: HTMLLIElement
    isEditable: boolean,
    cancelButton: HTMLButtonElement, 
    sortHandle?: HTMLElement
  }>) {
    const { item, isEditable, cancelButton, sortHandle } = e.detail;
    this.activeResult = isEditable ? 
      { item, cancelButton, ...(sortHandle && { sortHandle }) } : 
      null;
  }

  toggleResults({ currentTarget: button }: { currentTarget: HTMLButtonElement }) {
    const shouldShow = this.resultsListTarget.classList.contains('hidden');
    this.resultsListTarget.classList.toggle('hidden', !shouldShow);
    this.toggleResultsButtonTargets.forEach(btn => {
      btn.textContent = `${shouldShow ? 'Hide' : 'Show'} ${this.resultsListTarget.children.length}`;
    });
    if (shouldShow) {
      Cookies.remove(`csp-hide-results-${button.dataset.storyId}`);
    } else {
      Cookies.set(`csp-hide-results-${button.dataset.storyId}`, 'true');
    }
  }
}