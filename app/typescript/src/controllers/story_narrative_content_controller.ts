import FormController from './form_controller';

export default class StoryNarrativeContentController extends FormController<StoryNarrativeContentController> {
  static targets = [];

  // connect() {}

  // The submitForm action is attached to the form and triggered by:
  // 1 - an uploaded image
  // 2 - a `change` event on fields that may be auto-submitted
  // 3 - a `switch` event from BootstrapSwitchController
  submitForm({ target }: { target: HTMLElement }) {
    const name = 'name' in target ? target.name as string : null;
    
    
    
    // this.element.requestSubmit();
  }
}