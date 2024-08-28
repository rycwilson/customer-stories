import { Controller } from '@hotwired/stimulus';
import { debounce } from '../utils';

export default class StoryController extends Controller<HTMLDivElement> {
  static targets = [
    'titleInput',
    'narrativeTextarea',
    'hiddenLinkInput', 
    'hiddenLinkCopyBtn',
    'contributors',
    'resultsList'
  ];
  declare readonly titleInputTargets: HTMLInputElement[];
  declare readonly narrativeTextareaTargets: HTMLTextAreaElement[];
  declare readonly hiddenLinkInputTarget: HTMLInputElement;
  declare readonly hiddenLinkCopyBtnTarget: HTMLButtonElement;
  declare readonly contributorsTarget: HTMLDivElement;
  declare readonly resultsListTarget: HTMLUListElement;

  declare currentScreen: ScreenSize;
  resizeHandler = debounce(this.onResize.bind(this), 200);
 
  connect() {
    this.contributorsTarget.setAttribute('data-resource-init-value', 'true');
    window.addEventListener('resize', this.resizeHandler);
  }

  refreshHiddenLink() {
    // $(this).blur();
    // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
    const hiddenLink = window.location.origin + '/' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    this.hiddenLinkInputTarget.value = hiddenLink;
    this.hiddenLinkCopyBtnTarget.setAttribute('title', 'Save changes to enable Copy');
    window.removeEventListener('resize', this.resizeHandler);

    // $('.hidden-link__copy')
    //   .tooltip('fixTitle')
    //   .addClass('disabled')
  }

  onInitNarrativeEditor({ target: textarea }: { target: HTMLTextAreaElement }) {
    if (textarea.checkVisibility()) {
      this.currentScreen = <ScreenSize>textarea.id.match(/(?<screen>(sm|md-lg)$)/)?.groups?.screen;
    }
  }

  get visibleNarrativeTextarea() {
    return this.narrativeTextareaTargets.find(textarea => {
      const editor = <HTMLElement>textarea.nextElementSibling;
      return editor.checkVisibility();
    });
  }

  onResize() {
    const newNote = this.visibleNarrativeTextarea;
    const newScreen = <ScreenSize>newNote?.id.match(/(?<screen>(sm|md-lg)$)/)?.groups?.screen || 'xs';
    if (newScreen === this.currentScreen || newScreen === 'xs' || this.currentScreen === 'xs') {
      this.currentScreen = newScreen;
      return;
    }
    const oldNote = this.narrativeTextareaTargets.find(textarea => textarea !== newNote);
    const newTitle = <HTMLInputElement>this.titleInputTargets.find(input => input.id.includes(newScreen));
    const oldTitle = <HTMLInputElement>this.titleInputTargets.find(input => input !== newTitle);
    $(newNote).summernote('code', $(oldNote).summernote('code'));
    newTitle.value = oldTitle.value;
    this.currentScreen = newScreen;
  }
}