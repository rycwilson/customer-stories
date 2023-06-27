import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ['dtRow'];
  static values = { 
    ready: { type: Boolean, default: false },
    enableRowGroups: { type: Boolean, default: false },
    searchParams: Object
  };

  static baseOptions;
  didInitialize = false;

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
        console.log('initComplete')
        controller.didInitialize = true;
        controller.dispatch('init', { detail: {} });
      }
    }
  }

  connect() {
  }

  search() {

  }

  readyValueChanged(dataIsReady) {
    if (dataIsReady)
      this.dt = new DataTable(this.element, Object.assign({}, this.baseOptions, this.parentController().tableConfig()));
  }

  searchParamsValueChanged(params) {
    // console.log(this.element.id, 'searchParamsValueChanged()', params, this.didInitialize)
    
    // this.didInitialize does not work as a blocker because the ValueChanged callback is being called twice
    // What is it about a default empty object that causes the callback to repeat?
    // Note that explicitly setting data-datatable-search-params-value on the element prevents the double callback
    // if (this.didInitialize) {
    if (Object.keys(params).length !== 0) {
      // console.log(`${this.element.id} searchParams: `, searchParams)
      this.search(params)
    }
  }

  search({ curatorId, columnFilters, filterVal, searchResults }) {
    // console.log(`searchTable(${curatorId}, ${filterVal || searchResults})`)
    let dtSearch = this.dt
      .search('')
      .columns().search('')
      .column('curator:name').search(curatorId ? `^${curatorId}$` : '', true, false);

    columnFilters.forEach(({ column, q, regEx: isRegEx, smartSearch: useSmartSearch }) => {
      dtSearch = dtSearch.column(`${column}:name`).search(q, isRegEx, useSmartSearch);
    });
    
    // as the user types, search the table for the found options in the select box
    // => this ensures the datatables search matches the tomselect search
    if (searchResults) {
      Object.keys(searchResults).forEach(column => {
        dtSearch = dtSearch.column(`${column}:name`).search(`^(${searchResults[column]})$`, true, false);
      });
    } else if (filterVal) {
      const column = filterVal.slice(0, filterVal.indexOf('-'));
      const id = filterVal.slice(filterVal.indexOf('-') + 1, filterVal.length);
      dtSearch = dtSearch.column(`${column}:name`).search(`^${id}$`, true, false);
    }
    dtSearch.draw();
  }

  // toggle table stripes when alternating between row grouping and no row grouping
  // the Datatables table-striped class does not take row groups into account, hence this approach
  enableRowGroupsValueChanged(shouldEnable) {
    if (this.didInitialize) {
      this.element.classList.toggle('has-row-groups');
      this.dtRowTargets.forEach(tr => tr.classList.remove('even', 'odd'));
      if (!shouldEnable) this.dtRowTargets.forEach((tr, i) => tr.classList.add(i % 2 === 0 ? 'even' : 'odd'));
      this.dt.draw();
    }
  }

  redrawRowGroups() {
    const rowGroups = this.dt.rowGroup();
    const shouldEnable = this.enableRowGroupsValue;
    
    // without a timeout, the row groups get duplicated
    setTimeout(() => {
      if (!shouldEnable && rowGroups.enabled()) rowGroups.disable().draw();
      if (shouldEnable && !rowGroups.enabled()) rowGroups.enable().draw();
    })
  }

  parentController() {
    const parentControllerElement = (
      this.element.closest('[data-dashboard-target="subPanel"]') || 
      this.element.closest('[data-dashboard-target="tabPanel"]')
    );
    return this.application.getControllerForElementAndIdentifier(
      parentControllerElement, parentControllerElement.getAttribute('data-controller')
    );
  }
}