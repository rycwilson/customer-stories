import { Controller } from '@hotwired/stimulus';
import { summernoteConfig } from '../customer_wins/win_story'; 

const defaultHeight = '20rem';

// these values can't be calculated until the editor is initialized, so just hard code them for now
const summernoteToolbarHeight = 42; // childRow.querySelector('.note-toolbar');
const summernoteResizebarHeight = 20; // childRow.querySelector('.note-resizebar');

export default class WinStoryController extends Controller {
  static outlets = ['customer-win'];
  static targets = ['header', 'note', 'footer'];
  static values = {
    isExpanded: { type: Boolean, default: false },
    isEditable: { type: Boolean, default: false },
    contributions: { type: Array, default: [] },
    answers: { type: Array, default: [] }
  };


  initialize() {
    console.log('init win story')
  }

  connect() {
    console.log('connect win story');
    // console.log('contributions', this.contributionsValue)
    // console.log('answers', this.answersValue)
  }
  
  // use contenteditable instead of textarea because html can't be renderd in textarea
  initEditor(e) {
    // this.element.classList.add('is-edit-mode');   /
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
    if (isEditable) {
      this.isExpandedValue = true;  // do this first so correct height is calculated
      this.noteTarget.setAttribute(
        'data-summernote-config-value', 
        JSON.stringify( summernoteConfig(this.calcHeight, this.contributionsValue, this.answersValue) )
      ); 
      this.noteTarget.setAttribute('data-summernote-enabled-value', 'true');
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
      console.log('headerHeight', headerHeight)
      console.log('footerHeight', footerHeight)
      console.log('gapHeight', gapHeight)
      console.log('reservedHeight', reservedHeight)
      return window.innerHeight - reservedHeight;
    } else {
      // convert default height specified in rem to px
      return (
        parseInt(getComputedStyle(document.documentElement).fontSize, 10) * parseInt(defaultHeight, 10) 
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
    return this.isEditableValue ? summernoteToolbarHeight + summernoteResizebarHeight : 0;
  }
}