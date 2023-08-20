import { Controller } from '@hotwired/stimulus';

// these values can't be calculated until the editor is initialized, so just hard code them for now
const summernoteToolbarHeight = 42; // childRow.querySelector('.note-toolbar');
const summernoteResizebarHeight = 17; // childRow.querySelector('.note-resizebar');

export default class extends Controller {
  // summernote outlet is needed to pass config object with nested functions 
  // (can't JSON stringify as necessary for setting attribute)
  static outlets = ['customer-win'];    
  static targets = ['header', 'note', 'footer'];
  static values = {
    isExpanded: { type: Boolean, default: true },   // expand on first time enabling editor
    isEditable: { type: Boolean, default: false },
    contributions: { type: Array, default: [] },
    answers: { type: Array, default: [] }
  };

  defaultHeight;

  initialize() {
    // console.log('init win story')
  }

  connect() {
    // console.log('connect win story');
    // console.log('contributions', this.contributionsValue)
    // console.log('answers', this.answersValue)
    this.defaultHeight = parseInt( getComputedStyle(this.noteTarget).height, 10);
  }
  
  
  initEditor(e) {
    this.isEditableValue = true;
  }

  view() {
    const newHeight = this.isExpandedValue ? getComputedStyle(editor).height : defaultWinStoryHeight;
    this.element.classList.remove('is-edit-mode');
    if (this.element.classList.contains('has-changes')) {
      // submit form
    } else {

    }
    const html = populatePlaceholders($(this.noteTarget).summernote('code'));
    $(this.noteTarget).summernote('destroy');
    this.noteTarget.innerHTML = html;
    this.noteTarget.style.height = newHeight;
    this.noteTarget.contentEditable = 'false';
    this.element.querySelector('.btn-copy').disabled = false;
    this.isExpandedValue ? this.parentRow.scrollIntoView() : this.childRow.scrollIntoView({ block: 'center' });
  }

  // toggleIsExpanded() {
  //   this.isExpandedValue = !this.isExpandedValue;
  // }

  // toggleIsEditable() {
  //   this.isEditable = !this.isEditable;
  // }

  isExpandedValueChanged(isExpanded, wasExpanded) {
    if (wasExpanded === undefined) return false;
    this.element.classList.toggle('is-expanded');
  }

  isEditableValueChanged(isEditable, wasEditable) {
    if (wasEditable === undefined) return false;
    this.element.classList.toggle('is-edit-mode');

    // TODO: this isn't going to work when minimizing an editable win story
    if (isEditable) {
      this.noteTarget.setAttribute(
        'data-summernote-config-args-value', 
        JSON.stringify([this.calcHeight, this.contributionsValue, this.answersValue])
      )
      this.noteTarget.setAttribute('data-summernote-enabled-value', 'true');
      this.isExpandedValue ? this.parentRow.scrollIntoView() : this.childRow.scrollIntoView({ block: 'center' });
    }
  }

  // to resize, the editor must be destroyed and re-initialized
  resize() {
    if (this.isEditableValue) {
      $(this.noteTarget).summernote('destroy');
      // init
    } else {
      this.noteTarget.style.height = `${this.calcHeight}px`;
      this.element.classList.toggle('is-expanded');
    }
  }

  get calcHeight() {
    const chromeHeight = this.isEditableValue ? summernoteToolbarHeight + summernoteResizebarHeight : 0;
    if (this.isExpandedValue) {
      const headerHeight = this.headerTarget.clientHeight;
      const footerHeight = this.footerTarget.clientHeight;
      const gapHeight = [
        getComputedStyle(this.childRow.firstElementChild).paddingTop, 
        getComputedStyle(this.childRow.firstElementChild).paddingBottom,
        getComputedStyle(this.noteTarget || this.noteTarget.nextElementSibling).marginBottom
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

  get childRow() {
    return this.parentRow.nextElementSibling;
  }
}