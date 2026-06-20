import { Controller } from '@hotwired/stimulus';
// import { FetchRequest } from '@rails/request.js';
import { copyToClipboard } from '../utils';

export default class StoryController extends Controller<HTMLDivElement> {
  static targets = [
    'titleInput',
    'narrativeTextarea',
    'hiddenLinkInput', 
    'hiddenLinkCopyBtn',
    'contributions',
    'resultsList',
    'settingsForm',
  ];
  declare readonly titleInputTargets: HTMLInputElement[];
  declare readonly narrativeTextareaTargets: HTMLTextAreaElement[];
  declare readonly hiddenLinkInputTarget: HTMLInputElement;
  declare readonly hiddenLinkCopyBtnTarget: HTMLButtonElement;
  declare readonly contributionsTarget: HTMLDivElement;
  declare readonly resultsListTarget: HTMLUListElement;
  declare readonly settingsFormTarget: HTMLFormElement;

  connect() {
    this.contributionsTarget.setAttribute('data-resource-init-value', 'true');
  }

  updateSettings(_e?: Event) {
    this.settingsFormTarget.requestSubmit();
  }

  // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
  refreshHiddenLink({ currentTarget: btn }: { currentTarget: HTMLButtonElement }) {
    const confirmMesg = "Generate a new private link? This will invalidate any previous links.";
    if (this.hiddenLinkInputTarget.value === '' || window.confirm(confirmMesg)) {
      const hiddenLink = window.location.origin + '/' + Date.now().toString(36) + Math.random().toString(36).substring(2);
      this.hiddenLinkInputTarget.value = hiddenLink;
      this.hiddenLinkCopyBtnTarget.classList.remove('disabled');
      this.hiddenLinkCopyBtnTarget.disabled = false;
      this.updateSettings();
      btn.blur();
    }
  }

  copyHiddenLink() {
    copyToClipboard(this.hiddenLinkInputTarget.value);
  }
}