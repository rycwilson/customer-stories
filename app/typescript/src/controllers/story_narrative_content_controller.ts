import { type TurboSubmitStartEvent } from '@hotwired/turbo';
import FormController from './form_controller';

export default class StoryNarrativeContentController extends FormController<StoryNarrativeContentController> {
  static targets = ['result'];
  declare readonly resultTargets: HTMLLIElement[];

  // connect() {}

  onSubmitStart(e: TurboSubmitStartEvent) {
    const { body, submitter } = e.detail.formSubmission;
    const fieldName = submitter?.dataset.fieldName;
    
    // The presence of a submit button indicates a single field submission
    if (fieldName) {
      const keep = new Set(['_method', 'authenticity_token']);
      for (const key of [...body.keys()]) {
        if (keep.has(key)) continue;
        if (key !== fieldName) body.delete(key);
      }
    }
  }

  onSubmitEnd() {
  }

  onNewResultInput({ target: input }: { target: HTMLInputElement }) {
    const btn = <HTMLButtonElement>input.nextElementSibling;
    const min = input.minLength;
    const max = input.maxLength;
    if (!btn || isNaN(min) || isNaN(max)) return;
    
    const len = input.value.trim().length;
    btn.classList.toggle('hidden', len < min || len > max);
    // btn.classList.toggle('disabled', !isValid);
    // btn.disabled = !isValid;
  }

  onSortedResults({ detail: { item, oldIndex, newIndex } }: CustomEvent<{ item: HTMLElement, oldIndex: number, newIndex: number }>) {
    console.log(`from ${oldIndex} to ${newIndex}`, item);
    const setNewPosition = (li: HTMLLIElement, i: number) => {
      const input = li.querySelector(':scope > [name*="[position]"]');
      if (input) input.setAttribute('value', i.toString());
    }
    this.resultTargets.forEach(setNewPosition);
    this.element.requestSubmit();
  }
}