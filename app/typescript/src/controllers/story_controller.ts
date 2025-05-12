import { Controller } from '@hotwired/stimulus';

export default class StoryController extends Controller<HTMLDivElement> {
  static targets = [
    'titleInput',
    'narrativeTextarea',
    'hiddenLinkInput', 
    'hiddenLinkCopyBtn',
    'contributions',
    'resultsList'
  ];
  declare readonly titleInputTargets: HTMLInputElement[];
  declare readonly narrativeTextareaTargets: HTMLTextAreaElement[];
  declare readonly hiddenLinkInputTarget: HTMLInputElement;
  declare readonly hiddenLinkCopyBtnTarget: HTMLButtonElement;
  declare readonly contributionsTarget: HTMLDivElement;
  declare readonly resultsListTarget: HTMLUListElement;

 
  connect() {
    this.contributionsTarget.setAttribute('data-resource-init-value', 'true');
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