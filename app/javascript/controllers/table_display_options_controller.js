import { Controller } from '@hotwired/stimulus';
import { toggleRowGroups, initDisplayOptions as resetDisplayOptions } from '../tables';

export default class extends Controller {
  static outlets = ['dashboard', 'resource'];

  clickAwayHandler;

  initialize() {
  }

  connect() {
    this.clickAwayHandler = this.onClickAway.bind(this);
    document.addEventListener('click', this.clickAwayHandler);
  }

  disconnect() {
    resetDisplayOptions(this.resourceOutlet, true);
    document.removeEventListener('click', this.clickAwayHandler);
  }
  
  onClickAway(e) {
    if (!this.element || this.element.contains(e.target) || this.resourceOutlet.tableDisplayOptionsBtnTarget.contains(e.target))
      return false;
    
    // $(this.element).popover('hide')
    this.resourceOutlet.tableDisplayOptionsBtnTarget.click();
  }

  toggleRowGroups(e) {
    toggleRowGroups(this.resourceOutlet, e.target.checked);
  }

  toggleFilter(e) {
    const { id, checked } = e.target;
    const label = this.resourceOutlet.checkboxFiltersValue[id].label;
    this.resourceOutlet.checkboxFiltersValue = (
      {...this.resourceOutlet.checkboxFiltersValue, ...{ [`${id}`]: { checked, label } } }
    );
  }
}