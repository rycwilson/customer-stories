import type { TurboSubmitStartEvent, TurboSubmitEndEvent, FormSubmission } from '@hotwired/turbo';
import FormController from './form_controller';

export default class ContributorPromptsController extends FormController<ContributorPromptsController> {
  static targets = ['promptsList', 'newPromptInput','_destroyCheckbox'];
  declare readonly promptsListTarget: HTMLUListElement;
  declare readonly newPromptInputTarget: HTMLInputElement;
  declare readonly _destroyCheckboxTargets: HTMLInputElement[];

  activePrompt: { item: HTMLLIElement, cancelButton: HTMLButtonElement, sortHandle?: HTMLElement } | null = null;

  onSubmitStart(e: TurboSubmitStartEvent) {
    // console.log('start', e)
    const { formSubmission }: { formSubmission: FormSubmission & { stopped?: boolean } } = e.detail;
    const { body, submitter } = formSubmission;
    const fieldName = submitter?.dataset.fieldName;
    
    // if (!submitter || !fieldName) return;
    
    // console.log(`submitting ${fieldName}`)
    
    // if (this.activeSubmissions[fieldName]) {
    //   // console.log(`stopping ${fieldName}`)
    //   formSubmission.stopped = true;
    //   formSubmission.stop();
    //   return;
    // }

    // if (this.activePrompt) {
    //   this.activePrompt.cancelButton.disabled = true;
    //   $(this.activePrompt.cancelButton).tooltip('destroy');
    //   this.activePrompt.sortHandle?.classList.add('list-group-item__handle--disabled');
    // }

    // Remove all other fields from the submission body to avoid unnecessary data in the payload.
    // const keep = new Set(['_method', 'authenticity_token']);
    // for (const key of [...body.keys()]) {
    //   if (keep.has(key)) continue;
    //   if (key !== fieldName) body.delete(key);
    // }

    // this.animateSubmit(e, submitter);
  }

  onSubmitEnd(e: TurboSubmitEndEvent) {
    // console.log('end', e)
    const { formSubmission }: { formSubmission: FormSubmission & { stopped?: boolean } } = e.detail;
    const { submitter } = formSubmission;
    const fieldName = submitter?.dataset.fieldName;

    if (!submitter || !fieldName || formSubmission.stopped) return;
    
    submitter.classList.remove('submitting', 'btn--working');
    submitter.classList.add('hidden');
  }

  onToggleNewPrompt({ detail: { isActive } }: CustomEvent<{ isActive: boolean }>) {
    this.newPromptInputTarget.name = (
      isActive ? 'company[contributor_questions_attributes][0][question]' : ''
    );
    // this.promptsListTarget.classList.toggle('list-group--has-active', isActive);
  }

  deletePrompt({ detail: { item } }: CustomEvent<{ item: HTMLLIElement, input: HTMLInputElement }>
  ) {
    const _destroyCheckbox = (
      <HTMLInputElement>this._destroyCheckboxTargets.find(checkbox => item.contains(checkbox))
    );
    console.log(_destroyCheckbox)
    this.promptsListTarget.classList.add('list-group--has-active');
    item.classList.add('list-group-item--deleting');
    _destroyCheckbox.checked = true;
    this.element.requestSubmit();
  }
}