import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static outlets = ['dashboard', 'customer-wins', 'contributors'];

  parentController;
  clickAwayHandler;

  initialize() {
  }

  connect() {
    this.clickAwayHandler = this.onClickAway.bind(this);
    document.addEventListener('click', this.clickAwayHandler);
  }

  disconnect() {
    this.dashboardOutlet.initTableDisplayOptionsPopover.bind(this.parentCtrl())(true);
    document.removeEventListener('click', this.clickAwayHandler);
  }

  onClickAway(e) {
    if (!this.element || this.element.contains(e.target) || this.parentCtrl().tableDisplayOptionsBtnTarget.contains(e.target))
      return false;
    
    // $(this.element).popover('hide')
    this.parentCtrl().tableDisplayOptionsBtnTarget.click();
  }

  toggleRowGroups(e) {
    this.parentCtrl().toggleRowGroups(e);
  }

  toggleFilter(e) {
    const { id, checked } = e.target;
    const label = this.parentCtrl().checkboxFiltersValue[id].label;
    this.parentCtrl().checkboxFiltersValue = Object.assign({}, this.parentCtrl().checkboxFiltersValue, { 
      [`${id}`]: { checked, label }
    });
  }

  parentCtrl() {
    return this.dashboardOutlet.parentCtrl.bind(this)();
  }
}