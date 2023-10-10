import { tsBaseOptions } from '../../tomselect.js';

export function initTableControls(tableControls, tableWrapper, table) {
  // const addBtn = document.getElementById('prospect').querySelector('layout-sidebar .nav .btn-add');
  // $(addBtn).show();
  const dt = $(table).DataTable();
  const paginationBtns = tableWrapper.querySelector('.dataTables_paginate');
  const checkboxFilters = tableControls.querySelectorAll('.checkbox-filter');
  let curatorId = CSP.currentUser.id;
  let filterVal = '';
  let currentFilterOptions;   // the select options resulting from search
  $(paginationBtns).show();
  tableControls.querySelector('.toggle-row-groups').addEventListener('change', () => toggleRowGroups(table));
  checkboxFilters.forEach(checkbox => (
    checkbox.addEventListener('change', () => searchTable(dt, checkboxFilters, curatorId, filterVal))
  ));
  const tsCurator = new TomSelect(
    tableControls.querySelector('select.curator-select'), 
    Object.assign({}, tsBaseOptions, { onChange: (newVal) => searchTable(dt, checkboxFilters, curatorId = newVal, filterVal) })
  );
  tsCurator.setValue(CSP.currentUser.id, true);   // don't emit change event on initilization
  const tsFilter = new TomSelect(
    tableControls.querySelector('select.dt-filter'),
    Object.assign({}, tsBaseOptions, { 
      onChange(newVal) {
        searchTable(dt, checkboxFilters, curatorId, filterVal = newVal);
      }, 
      onType() {
        currentFilterOptions = this.currentResults.items;
        const searchResults = this.currentResults.items
          .map(item => item.id)
          .reduce((results, result) => {
            const column = result.slice(0, result.indexOf('-'));
            const id = result.slice(result.indexOf('-') + 1, result.length);
            if (!results[column]) results[column] = `${id}`
            else results[column] = `${results[column]}|${id}`;
            return results;
          }, {});
        searchTable(dt, checkboxFilters, curatorId, filterVal = searchResults);
      },
      onDropdownOpen(dropdown) {
        // if a search string exists, manually set the current results
        if (this.getValue() === '0') this.currentResults.items = currentFilterOptions;
      },
      onDropdownClose(dropdown) {
        // default behavior is that text input is cleared when the dropdown closes, 
        // but we want to keep it since the search results are reflected in the table
        // => accomplished by adding and selecting an option to match the search text
        if (!this.getValue() && this.lastQuery) {
          this.addOption({ value: 0, text: this.lastQuery }, true);   // true => option will be removed on clear
          this.addItem(0, true);    // true => don't trigger change event
        }
      }
    })
  );

  // Need to explicitly search the table due to curator change event being silenced
  searchTable(dt, checkboxFilters, curatorId, filterVal);
}

// toggle table stripes when alternating between row grouping and no row grouping
// the Datatables table-striped class does not take row groups into account, hence this approach
export function toggleRowGroups(table) {
  const removingGroups = table.classList.contains('has-row-groups');
  const dataRows = table.querySelectorAll('tbody > tr:not(.dtrg-group)');
  table.classList.toggle('has-row-groups');
  dataRows.forEach(tr => tr.classList.remove('even', 'odd'));
  if (removingGroups) dataRows.forEach((tr, i) => tr.classList.add(i % 2 === 0 ? 'even' : 'odd'));
  $(table).DataTable().draw();
}

export function redrawRowGroups(tableControls, rowGroups) {
  const rowGroupsCheckbox = tableControls && tableControls.querySelector('.toggle-row-groups');
  if (rowGroupsCheckbox) {
    const shouldEnable = rowGroupsCheckbox.checked;

    // without a timeout, the row groups get duplicated
    setTimeout(() => {
      if (!shouldEnable && rowGroups.enabled()) rowGroups.disable().draw();
      if (shouldEnable && !rowGroups.enabled()) rowGroups.enable().draw();
    })
  }
}

export function cloneFilterResults(tableControls, tableWrapper, table) {
  const originalResults = tableWrapper.querySelector('.dataTables_info');
  const clone = originalResults.cloneNode();
  const formatText = () => clone.textContent = originalResults.textContent.replace(/\sentries/g, '');
  clone.id = `${originalResults.id}--clone`;
  clone.classList.add('help-block', 'text-right');
  formatText();
  tableControls.querySelector('.select-filters').appendChild(clone);
  $(table).on('draw.dt', formatText);
};

function searchTable(dt, checkboxFilters, curatorId, filterVal) {
  console.log(`searchTable(${curatorId}, ${filterVal})`)
  let dtSearch = dt
    .search('')
    .columns().search('')
    .column('curator:name').search(curatorId ? `^${curatorId}$` : '', true, false);

  // checkboxFilters.forEach(checkbox => {
  //   if (checkbox.id === 'show-wins-with-story') {
  //     dtSearch = dtSearch.column('story:name').search(checkbox.checked ? '' : '^false$', true, false);
  //   } else if (checkbox.id === 'show-completed') {
  //     dtSearch = dtSearch.column('status:name').search(checkbox.checked ? '' : '^((?!completed).)*$', true, false);
  //   } else if (checkbox.id === 'show-published') {
  //     dtSearch = dtSearch.column('storyPublished:name').search(checkbox.checked ? '' : 'false');
  //   }
  // });
  
  // as the user types, search the table for the found options in the select box
  // => this ensures the datatables search matches the tomselect search
  if (typeof filterVal === 'object') {
    Object.keys(filterVal).forEach(column => {
      dtSearch = dtSearch.column(`${column}:name`).search(`^(${filterVal[column]})$`, true, false);
    });
  } else if (filterVal) {
    const column = filterVal.slice(0, filterVal.indexOf('-'));
    const id = filterVal.slice(filterVal.indexOf('-') + 1, filterVal.length);
    dtSearch = dtSearch.column(`${column}:name`).search(`^${id}$`, true, false);
  }

  dtSearch.draw();
}