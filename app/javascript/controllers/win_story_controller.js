import { Controller } from '@hotwired/stimulus';
import { summernoteConfig } from '../customer_wins/win_story'; 

export default class extends Controller {
  static outlets = ['customer-win'];
  static targets = ['header', 'note', 'footer'];
  static values = {
    isExpanded: { type: Boolean, default: false },
    isEditable: { type: Boolean, default: false },
    contributions: { type: Array, default: [] },
    answers: { type: Array, default: [] }
  };

  static defaultHeight = '20rem';
  
  // these values can't be calculated until the editor is initialized, so just hard code them for now
  static summernoteToolbarHeight = 42; // childRow.querySelector('.note-toolbar');
  static summernoteResizebarHeight = 20; // childRow.querySelector('.note-resizebar');

  connect() {
    console.log('connect win story');
    console.log('contributions', this.contributionsValue)
    console.log('answers', this.answersValue)
  }
  
  // use contenteditable instead of textarea because html can't be renderd in textarea
  initEditor(e) {
    // this.element.classList.add('is-edit-mode');   // do this first so that the correct height is calculated
    this.isEditableValue = true;
    setTimeout(() => {
      $(this.noteTarget)
        .prop('contenteditable', 'true')
        .summernote( summernoteConfig(this.calcHeight, this.contributionsValue, this.answersValue) );
    })
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
    if (isEditable) this.isExpandedValue = true;
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
    console.log('calcHeight', this.isExpandedValue, this.isEditableValue)
    if (this.isExpandedValue) {
      const headerHeight = this.headerTarget.clientHeight;
      const footerHeight = this.footerTarget.clientHeight;
      const gapHeight = [
        getComputedStyle(this.element.firstElementChild).paddingTop, 
        getComputedStyle(this.element.firstElementChild).paddingBottom,
        getComputedStyle(this.noteTarget).marginBottom
      ].reduce((totalGapHeight, segmentHeight) => totalGapHeight + parseInt(segmentHeight, 10), 0);
      const reservedHeight = this.parentRow.clientHeight + gapHeight + headerHeight + footerHeight + this.chromeHeight;
      return window.innerHeight - reservedHeight;
    } else {
      // convert default height specified in rem to px
      return (
        parseInt(getComputedStyle(document.documentElement).fontSize, 10) * parseInt(this.defaultHeight, 10) 
        - this.chromeHeight
      );
    }
  }
    
  get parentRow() {
    return this.customerWinOutlet.element;
  }

  get childRow() {
    return this.parentRow.nextElementSibling;
  }

  get chromeHeight() {
    return this.isEditableValue ? this.summernoteToolbarHeight + this.summernoteResizebarHeight : 0;
  }
}