import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static outlets = ['customer-win'];
  static targets = ['header', 'note', 'footer'];
  static values = {
    isExpanded: { type: Boolean, default: false },
    isEditMode: { type: Boolean, default: false }
  };

  static defaultHeight = '20rem';
  
  // these values can't be calculated until the editor is initialized, so just hard code them for now
  static summernoteToolbarHeight = 42; // childRow.querySelector('.note-toolbar');
  static summernoteResizebarHeight = 20; // childRow.querySelector('.note-resizebar');

  // this function will handle the 'is-expanded' class toggling
  init() {

  }

  // to resize, the editor must be destroyed and re-initialized
  resize() {
    if (this.isEditMode) {
      $(this.noteTarget).summernote('destroy');
    } else {
      this.noteTarget.style.height = `${this.calcHeight}px`;
      form.classList.toggle('is-expanded');
    }
  }

  calcHeight() {
    if (this.isExpanded) {
      const headerHeight = this.headerTarget.clientHeight;
      const footerHeight = this.footerTarget.clientHeight;
      const gapHeight = [
        getComputedStyle(this.element.firstElementChild).paddingTop, 
        getComputedStyle(this.element.firstElementChild).paddingBottom,
        getComputedStyle(this.noteTargewt).marginBottom
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

  get chromeHeight() {
    return this.isEditMode ? this.summernoteToolbarHeight + this.summernoteResizebarHeight : 0;
  }

}