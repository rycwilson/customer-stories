import { Controller } from '@hotwired/stimulus';
// import { FetchRequest } from '@rails/request.js';

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

  static values = {
    path: String,
  }
  declare readonly pathValue: string;

  connect() {
    this.contributionsTarget.setAttribute('data-resource-init-value', 'true');
  }

  updateSettings(_e: Event) {
    this.settingsFormTarget.requestSubmit();
  }

  onClickDelete() {
    if (window.confirm('Are you sure you want to delete this Story? This action cannot be undone.')) {
      console.log('ok')
    }
  }

  refreshHiddenLink() {
    // $(this).blur();
    // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
    const hiddenLink = window.location.origin + '/' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    this.hiddenLinkInputTarget.value = hiddenLink;
    this.hiddenLinkCopyBtnTarget.setAttribute('title', 'Save changes to enable Copy');
    // window.removeEventListener('resize', this.resizeHandler);

    // $('.hidden-link__copy')
    //   .tooltip('fixTitle')
    //   .addClass('disabled')
  }
}