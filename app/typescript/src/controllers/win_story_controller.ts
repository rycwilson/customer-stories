import { Controller } from '@hotwired/stimulus';
import type CustomerWinController from './customer_win_controller';
import { type SummernoteComponents } from '../summernote';
import { 
  populatePlaceholders, 
  individualContributionTemplate, 
  groupContributionTemplate } from '../customer_wins/win_story';

// these values can't be calculated until the editor is initialized, so just hard code them for now
const summernoteToolbarHeight = 42; // childRow.querySelector('.note-toolbar');
const summernoteResizebarHeight = 17; // childRow.querySelector('.note-resizebar');

export default class extends Controller<HTMLFormElement> {
  // summernote outlet is needed to pass config object with nested functions 
  // (can't JSON stringify as necessary for setting attribute)
  static outlets = ['customer-win'];   
  declare readonly customerWinOutlet: CustomerWinController; 

  static targets = ['header', 'note', 'footer', 'copyBtn'];
  declare readonly headerTarget: HTMLDivElement;
  declare readonly noteTarget: HTMLDivElement;
  declare readonly footerTarget: HTMLDivElement;
  declare readonly copyBtnTarget: HTMLButtonElement;

  static values = {
    isExpanded: { type: Boolean, default: false },
    isEditable: { type: Boolean, default: false },
    contributions: { type: Array, default: [] },
    answers: { type: Array, default: [] }
  };
  declare isExpandedValue: boolean;
  declare isEditableValue: boolean;
  declare contributionsValue: Contribution[];
  declare answersValue: ContributorAnswer[];

  declare editor: HTMLElement;
  declare defaultHeight: number;

  initialize() {
    // console.log('init win story')
  }

  connect() {
    // console.log('connect win story');
    this.defaultHeight = parseInt( getComputedStyle(this.noteTarget).height, 10 );
  }
  
  edit(e: Event) {
    this.isEditableValue = true;
    if (!this.isExpandedValue) this.resize();
    this.enableEditor();
    this.scrollToWinStory();
  }

  view() {
    this.isEditableValue = false;

    const newHeight = this.isExpandedValue ? getComputedStyle(this.editor).height : `${this.defaultHeight}px`;
    const populatedHtml = populatePlaceholders( 
      $(this.noteTarget).summernote('code'), this.contributionsValue, this.answersValue 
    )
    this.noteTarget.style.height = newHeight;
    $(this.noteTarget).summernote('code', populatedHtml);
    this.copyBtnTarget.disabled = false;
    this.disableEditor();
    this.scrollToWinStory();
  }

  resize(e?: Event) {
    const isAutoResize = !e;
    this.isExpandedValue = !this.isExpandedValue;
    if (this.isEditableValue && !isAutoResize) {
      // to resize, the editor must be destroyed and re-initialized
      this.disableEditor();
      setTimeout(() => this.enableEditor());
    } else {
      this.noteTarget.style.height = `${this.calcHeight}px`;
    }
    this.scrollToWinStory();
  }

  onInitWinStoryEditor({ detail: instance }: { detail: SummernoteComponents }) {
    this.editor = instance.editor[0];    // other summernote elements are in this payload => assign as needed
    this.copyBtnTarget.disabled = true;
  }

  enableEditor() {
    this.noteTarget.setAttribute(
      'data-summernote-config-args-value', 
      JSON.stringify([this.calcHeight, this.contributionsValue, this.answersValue])
    );
    this.noteTarget.setAttribute('data-summernote-enabled-value', 'true');
  }

  disableEditor() {
    this.noteTarget.setAttribute('data-summernote-enabled-value', 'false');
  }

  scrollToWinStory() {
    setTimeout(() => (
      this.isExpandedValue ? this.parentRow.scrollIntoView() : this.childRow.scrollIntoView({ block: 'center' })
    ));
  }

  isEditableValueChanged(isEditable: boolean, wasEditable: boolean) {
    if (wasEditable === undefined) return false;
    this.element.classList.toggle('is-editable');
  }

  isExpandedValueChanged(isExpanded: boolean, wasExpanded: boolean) {
    if (wasExpanded === undefined) return false;
    this.element.classList.toggle('is-expanded');
  }

  pasteContributionOrPlaceholder({ target: link }: { target: EventTarget }) {
    if (!(link instanceof HTMLAnchorElement)) return;
    const li = link.parentElement as HTMLLIElement;
    const isPlaceholder = li.dataset.placeholder;
    const isIndividualContribution = li.dataset.contributionId && !isPlaceholder;
    const isGroupContribution = li.dataset.questionId && !isPlaceholder;
    let html;
    if (isIndividualContribution && li.dataset.contributionId) {
      html = individualContributionTemplate(li.dataset.contributionId, this.contributionsValue, this.answersValue);
    } else if (isGroupContribution && li.dataset.questionId) { 
      html = groupContributionTemplate(li.dataset.questionId, this.contributionsValue, this.answersValue);
    } else if (isPlaceholder) {
      html = li.dataset.placeholder; 
    }
    if (html) {
      $(this.noteTarget).summernote('restoreRange');   // restore cursor position
      $(this.noteTarget).summernote('pasteHTML', html)
      $(this.noteTarget).summernote('saveRange');  // save cursor position
    }
  }

  get calcHeight() {
    const chromeHeight = this.isEditableValue ? summernoteToolbarHeight + summernoteResizebarHeight : 0;
    if (this.isExpandedValue) {
      if (!this.childRow || !this.childRow.firstElementChild) return;
      const headerHeight = this.headerTarget.clientHeight;
      const footerHeight = this.footerTarget.clientHeight;
      const gapHeight = [
        getComputedStyle(this.childRow.firstElementChild).paddingTop, 
        getComputedStyle(this.childRow.firstElementChild).paddingBottom,
        getComputedStyle(this.noteTarget.nextElementSibling || this.noteTarget).marginBottom
      ].reduce((totalGapHeight, segmentHeight) => totalGapHeight + parseInt(segmentHeight, 10), 0);
      const reservedHeight = this.parentRow.clientHeight + gapHeight + headerHeight + footerHeight + chromeHeight;
      return window.innerHeight - reservedHeight;
    } else {
      return this.defaultHeight - chromeHeight;
    }
  }
    
  get parentRow() {
    return this.customerWinOutlet.element;
  }

  // the win story only exists within the child row, so the child row is guaranteed to exist
  get childRow() {
    return this.parentRow.nextElementSibling as Element;
  }
}