import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ['dtRow'];
  static values = { 
    ready: { type: Boolean, default: false },
    rowGroups: { type: Boolean, default: false }
  };

  static baseOptions;
  didInitialize;

  initialize() {
    const controller = this;
    this.baseOptions = {
      // deferRender: true,
      autoWidth: false,
      dom: 'tip',
      pageLength: 100,
      drawCallback(settings) {
        if (controller.didInitialize) controller.redrawRowGroups();
      },
      initComplete(settings) {
        controller.didInitialize = true;
        controller.dispatch('init', { detail: {} });
      }
    }
  }

  connect() {
  }
    
  readyValueChanged(dataIsReady) {
    if (dataIsReady) {
      const parentControllerElement = (
        this.element.closest('[data-dashboard-target="subPanel"]') || 
        this.element.closest('[data-dashboard-target="tabPanel"]')
      );
      this.parentController = this.application.getControllerForElementAndIdentifier(
        parentControllerElement, parentControllerElement.getAttribute('data-controller')
      );
      this.dt = new DataTable(this.element, Object.assign({}, this.baseOptions, this.parentController.tableConfig()));
    }
  }

  // toggle table stripes when alternating between row grouping and no row grouping
  // the Datatables table-striped class does not take row groups into account, hence this approach
  rowGroupsValueChanged(shouldEnable) {
    if (this.didInitialize) {
      this.element.classList.toggle('has-row-groups');
      this.dtRowTargets.forEach(tr => tr.classList.remove('even', 'odd'));
      if (!shouldEnable) this.dtRowTargets.forEach((tr, i) => tr.classList.add(i % 2 === 0 ? 'even' : 'odd'));
      this.dt.draw();
    }
  }

  redrawRowGroups() {
    const rowGroups = this.dt.rowGroup();
    const shouldEnable = this.rowGroupsValue;
    
    // without a timeout, the row groups get duplicated
    setTimeout(() => {
      if (!shouldEnable && rowGroups.enabled()) rowGroups.disable().draw();
      if (shouldEnable && !rowGroups.enabled()) rowGroups.enable().draw();
    })
  }
}