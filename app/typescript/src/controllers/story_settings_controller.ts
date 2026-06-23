import FormController from "./form_controller";
import { copyToClipboard } from "../utils";

export default class StorySettingsController extends FormController<StorySettingsController> {
  static targets = [
    'hiddenLinkInput', 
    'hiddenLinkCopyBtn',
    'ogTitleInput',
    'ogDescriptionTextarea',
    'ogImageCard'
  ];
  declare readonly hiddenLinkInputTarget: HTMLInputElement;
  declare readonly hiddenLinkCopyBtnTarget: HTMLButtonElement;
  declare readonly ogTitleInputTarget: HTMLInputElement;
  declare readonly ogDescriptionTextareaTarget: HTMLTextAreaElement;
  declare readonly ogImageCardTarget: HTMLDivElement;

  // connect() {}

  submitForm({ target }: { target: HTMLElement }) {
    // Ignore 'change' event when it comes from one of the OG fields.
    // These elements will have a submit button associated with them.
    const name = 'name' in target ? target.name as string : null;
    if (name?.match(/story\[og_[a-z_]+\]/)) return;
    
    this.element.requestSubmit();
  }

  resetForm() {
    [this.ogTitleInputTarget, this.ogDescriptionTextareaTarget].forEach(input => {
      input.dataset.initialValue = input.value;
      const submitBtn = input.nextElementSibling as HTMLButtonElement;
      if (submitBtn) submitBtn.classList.add('hidden');
    });

    this.ogImageCardTarget.classList.remove('image-card--uploading');
  }

  // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
  refreshHiddenLink({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
    const confirmMesg = "Generate a new private link? This will invalidate any previous links.";
    if (this.hiddenLinkInputTarget.value === '' || window.confirm(confirmMesg)) {
      const hiddenLink = (
        window.location.origin + '/' + Date.now().toString(36) + Math.random().toString(36).substring(2)
      );
      this.hiddenLinkInputTarget.value = hiddenLink;
      this.hiddenLinkCopyBtnTarget.classList.remove('disabled');
      this.hiddenLinkCopyBtnTarget.disabled = false;
      this.submitForm({ target: this.hiddenLinkInputTarget });
      btn.blur();
    }
  }

  copyHiddenLink() {
    copyToClipboard(this.hiddenLinkInputTarget.value);
  }
}