import type { TurboSubmitStartEvent, TurboSubmitEndEvent, FormSubmission } from '@hotwired/turbo';
import FormController from './form_controller';
import Cookies from 'js-cookie';

export default class StoryNarrativeContentController extends FormController<StoryNarrativeContentController> {
  static targets = [
    'titleInput',
    'titleSubmit',
    'resultsList',
    'toggleResultsButton'
  ];
  declare readonly titleInputTarget: HTMLInputElement;
  declare readonly titleSubmitTarget: HTMLButtonElement;
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
    
    // if (this.activeSubmissions[fieldName]) {
    //   // console.log(`stopping ${fieldName}`)
    //   formSubmission.stopped = true;
    //   formSubmission.stop();
    //   return;
    // }

    // if (this.activeResult) {
    //   this.activeResult.cancelButton.disabled = true;
    //   $(this.activeResult.cancelButton).tooltip('destroy');
    //   this.activeResult.sortHandle?.classList.add('list-group-item__handle--disabled');
    // }

    // Remove all other fields from the submission body to avoid unnecessary data in the payload.
    // console.log('submitting field:', fieldName)
    // const keep = new Set(['_method', 'authenticity_token']);
    // for (const key of [...body.keys()]) {
    //   if (keep.has(key)) continue;
    //   if (key !== fieldName) body.delete(key);
    // }

    // this.activeSubmissions[fieldName] = formSubmission;

    this.toggleResultsButtonTargets.forEach(btn => btn.disabled = true);

    super.onSubmitStart(e);
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

  deleteResult(e: CustomEvent<{ submitter: HTMLButtonElement, input: HTMLInputElement }>) {
    const { submitter, input } = e.detail;
    input.name = '';

    // - We need the submitter to access submitter.dataset.fieldName in this.onSubmitStart();
    // this allows us to filter the fields submitted with the form.
    // - The delete button is not intended to directly submit the form, so it is type="button";
    // Here we'll change it to type="submit" as this is what requestSubmit expects.
    submitter.type = 'submit';
    this.element.requestSubmit(submitter);
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