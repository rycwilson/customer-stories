import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static outlets = ['dashboard', 'customer-wins', 'contributors'];

  parentController;

  initialize() {
    console.log('init table display options')
  }

  connect() {
  }

  disconnect() {
    console.log('disconnecting table-display-options...')
    console.log('dashboard: ', this.dashboardOutlet.identifier)
    console.log('parentCtrl(): ', this.parentCtrl().identifier)
    this.dashboardOutlet.initTableDisplayOptionsPopover.bind(this.parentCtrl())(true);
  }

  toggleRowGroups(e) {
    this.parentCtrl().toggleRowGroups(e);
  }

  toggleFilter(e) {
    const { id, checked } = e.target;
    const label = this.parenCtrl().checkboxFiltersValue[id].label;
    this.parentCtrl().checkboxFiltersValue = Object.assign({}, this.parentCtrl().checkboxFiltersValue, { 
      [`${id}`]: { checked, label }
    });
  }

  parentCtrl() {
    return this.dashboardOutlet.parentCtrl.bind(this)();
  }
}