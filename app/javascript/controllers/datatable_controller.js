import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ['row'];   // excludes row groups
  static outlets = ['dashboard', 'customer-wins', 'contributors', 'stories'];
  static values = { 
    ready: { type: Boolean, default: false },
    enableRowGroups: { type: Boolean, default: false },
    searchParams: Object
  };

  static baseOptions;
  dt;
  didInitialize = false;
  searchDebounceTimer;
  parentController;

  initialize() {
    const ctrl = this;
    this.baseOptions = {
      deferRender: true,
      autoWidth: false,
      dom: 'tip',
      pageLength: 75,
      drawCallback(settings) {
        // console.log('drawCallback()')
        if (ctrl.didInitialize) ctrl.redrawRowGroups();
        ctrl.dispatch(`${ctrl.parentCtrl().identifier}-drawn`)
      },
      initComplete(settings) {
        ctrl.cloneFilterResults();
        ctrl.didInitialize = true;
        ctrl.dispatch('init', { detail: { dt: this.api() } });
      }
    }
  }

  connect() {
  }

  readyValueChanged(dataIsReady) {
    if (dataIsReady)
      this.dt = new DataTable(this.element, Object.assign({}, this.baseOptions, this.parentCtrl().tableConfig()));
  }

  searchParamsValueChanged(newVal, oldVal) {
    if (oldVal !== undefined) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => this.search(newVal), 200);
    }
  }

  search({ curatorId, columnFilters, filterVal, searchResults }) {
    // console.log('search')
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
      // console.log(`${column}:name`, `^${id}$`)
      dtSearch = dtSearch.column(`${column}:name`).search(`^${id}$`, true, false);
    }
    dtSearch.draw();
  }

  // toggle table stripes when alternating between row grouping and no row grouping
  // the Datatables table-striped class does not take row groups into account, hence this approach
  enableRowGroupsValueChanged(shouldEnable) {
    if (this.didInitialize) {
      // this.element.classList.toggle('has-row-groups');
      this.rowTargets.forEach(tr => tr.classList.remove('even', 'odd'));
      if (!shouldEnable) this.rowTargets.forEach((tr, i) => tr.classList.add(i % 2 === 0 ? 'even' : 'odd'));
      this.dt.draw();
    }
  }

  redrawRowGroups() {
    const rowGroups = this.dt.rowGroup();
    const shouldEnable = this.enableRowGroupsValue;
    const shouldRedraw = (!shouldEnable && rowGroups.enabled()) || (shouldEnable && !rowGroups.enabled());
    
    // without a timeout, the row groups get duplicated
    setTimeout(() => {
      if (shouldEnable && shouldRedraw) rowGroups.enable().draw();
      if (!shouldEnable && shouldRedraw) rowGroups.disable().draw();
      if (shouldRedraw) this.element.classList.toggle('has-row-groups');
    })
  }

  cloneFilterResults() {
    const originalResults = this.element.nextElementSibling;
    const clone = originalResults.cloneNode();
    const formatText = () => clone.textContent = originalResults.textContent.replace(/\sentries/g, '');
    clone.id = `${originalResults.id}--clone`;
    formatText();
    this.parentCtrl().filterResultsTarget.appendChild(clone);
    $(this.element).on('draw.dt', formatText);
  }

  parentCtrl() {
    return this.dashboardOutlet.parentCtrl.bind(this)();
  }
}